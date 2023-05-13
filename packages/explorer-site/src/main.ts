window.onclick = function (ev) {
    let target = ev.target;
    while (target instanceof Element) {
        if (target.tagName === "A") {
            const href = target.getAttribute("data-href");
            const rel = target.getAttribute("rel");
            if (!rel) {
                ev.preventDefault();
                if (href) {
                    /*
                    const myTitle = window.document.title;
                    window.document.title = this.contentWindow.document.title + " - " + myTitle;
                    window.history.replaceState(null, "", "#" + this.contentWindow.location);
                    */
                   if (window.location.hash.startsWith("#") ) {
                    var base = window.location.href.split('#')[0];
                    window.location.href = base + "#" + href;
                   }
                }
            }
            break;
        }
        target = target.parentElement;
    }
}
