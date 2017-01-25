(function(window){
"use strict";
var document = window.document;


// parse slide data (url, title, size ...) from DOM elements
// (children of gallerySelector)
function parseThumbnailElements(el) {
    var thumbElements = el.childNodes,
        numNodes = thumbElements.length,
        items = [],
        figureEl,
        linkEl,
        size,
        item;

    for(var i = 0; i < numNodes; i++) {
        figureEl = thumbElements[i]; // <figure> element

        // include only element nodes
        if(figureEl.nodeType !== 1) {
            continue;
        }

        linkEl = figureEl.children[0]; // <a> element

        size = linkEl.getAttribute('data-size').split('x');

        // create slide object
        item = {
            src: linkEl.getAttribute('href'),
            w: parseInt(size[0], 10),
            h: parseInt(size[1], 10)
        };

        if(figureEl.children.length > 1) {
            // <figcaption> content
            item.title = figureEl.children[1].innerHTML;
        }

        if(linkEl.children.length > 0) {
            // <img> thumbnail element, retrieving thumbnail url
            item.msrc = linkEl.children[0].getAttribute('src');
        }

        item.el = figureEl; // save link to element for getThumbBoundsFn
        items.push(item);
    }

    return items;
}

// find nearest parent element
function getClosestParentNode(el, fn) {
    return el && ( fn(el) ? el : getClosestParentNode(el.parentNode, fn) );
}

// triggers when user clicks on thumbnail
function onThumbnailsClick(e) {
    e = e || window.event;
    if(e.preventDefault)
        e.preventDefault();
    else
        e.returnValue = false;

    var eTarget = e.target || e.srcElement;

    // find root element of slide
    var clickedListItem = getClosestParentNode(eTarget, function(el) {
        return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
    });

    if(!clickedListItem) {
        return;
    }

    // find index of clicked item by looping through all child nodes
    // alternatively, you may define index via data- attribute
    var clickedGallery = clickedListItem.parentNode,
        childNodes = clickedListItem.parentNode.childNodes,
        numChildNodes = childNodes.length,
        nodeIndex = 0,
        index;

    for (var i = 0; i < numChildNodes; i++) {
        if(childNodes[i].nodeType !== 1) {
            continue;
        }

        if(childNodes[i] === clickedListItem) {
            index = nodeIndex;
            break;
        }
        nodeIndex++;
    }

    if(index >= 0) {
        // open PhotoSwipe if valid index found
        openPhotoSwipe( index, clickedGallery );
    }
    return false;
}

// parse picture index and gallery index from URL (#&pid=1&gid=2)
function photoswipeParseHash() {
    var hash = window.location.hash.substring(1),
    params = {};

    if(hash.length < 5) {
        return params;
    }

    var vars = hash.split('&');
    for (var i = 0; i < vars.length; i++) {
        if(!vars[i]) {
            continue;
        }
        var pair = vars[i].split('=');
        if(pair.length < 2) {
            continue;
        }
        params[pair[0]] = pair[1];
    }

    if(params.gid) {
        params.gid = parseInt(params.gid, 10);
    }

    return params;
}

function openPhotoSwipe(index, galleryElement, disableAnimation, fromURL) {
    var pswpElement = document.querySelectorAll('.pswp')[0],
        gallery,
        options,
        items;

    items = parseThumbnailElements(galleryElement);

    // define options (if needed)
    options = {

        // define gallery index (for URL)
        galleryUID: galleryElement.getAttribute('data-pswp-uid'),

        getThumbBoundsFn: function(index) {
            // See Options -> getThumbBoundsFn section of documentation for more info
            var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                rect = thumbnail.getBoundingClientRect();

            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
        }

    };

    // PhotoSwipe opened from URL
    if(fromURL) {
        if(options.galleryPIDs) {
            // parse real index when custom PIDs are used
            // http://photoswipe.com/documentation/faq.html#custom-pid-in-url
            for(var j = 0; j < items.length; j++) {
                if(items[j].pid == index) {
                    options.index = j;
                    break;
                }
            }
        } else {
            // in URL indexes start from 1
            options.index = parseInt(index, 10) - 1;
        }
    } else {
        options.index = parseInt(index, 10);
    }

    // exit if index not found
    if( isNaN(options.index) ) {
        return;
    }

    if(disableAnimation) {
        options.showAnimationDuration = 0;
    }

    // Pass data to PhotoSwipe and initialize it
    gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
    gallery.init();
}

function initPhotoSwipeFromDOM(gallerySelector) {
    // loop through all gallery elements and bind events
    var galleryElements = document.querySelectorAll( gallerySelector );

    for(var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i+1);
        galleryElements[i].onclick = onThumbnailsClick;
    }

    // Parse URL and open gallery if it contains #&pid=3&gid=1
    var hashData = photoswipeParseHash();
    if(hashData.pid && hashData.gid) {
        openPhotoSwipe( hashData.pid ,  galleryElements[ hashData.gid - 1 ], true, true );
    }
}


function unscrambleMailLink(anchor) {
    var href = anchor.textContent
                     .replace(/\s+/g, '')
                     .replace(/[\[({]at[})\]]/, '@')
                     .replace(/[\[({]dot[})\]]/,'.')
      , name = anchor.getAttribute('data-name')
      , mailto = 'mailto:'
      ;

    if(name)
        mailto += encodeURI(name) + '<' + encodeURI(href) + '>';
    else
        mailto += encodeURI(href);
    anchor.setAttribute('href', mailto);
    anchor.textContent = href;
}





// document ready stuff
var docReadyQueue = [];
function docReadyExecute() {
    var fn;
    while((fn = docReadyQueue.shift()) !== undefined)
        fn();
}

function docReady(fn) {
    if(fn)
        docReadyQueue.push(fn);
    if(document.readyState == "interactive" )
        docReadyExecute();
}

function initDocReady() {
    // alternative to DOMContentLoaded, IE8 safe
    document.onreadystatechange = function () {
        if (document.readyState == "interactive")
            docReadyExecute();
    };
}

initDocReady();

if(window.PhotoSwipe)
    docReady(initPhotoSwipeFromDOM.bind(null, '.gallery'));

// photo gallery stuff
if(window.$)
    docReady(function(){
      window.$('.projekte_carousel').slick({
          autoplay: true
        , dots: true
      });
    });

docReady(function(){
    var mailLinks = document.getElementsByClassName('email-link'),
      i, l
      ;
    for(i=0,l=mailLinks.length;i<l;i++)
        unscrambleMailLink(mailLinks[i]);
});


})(window);
