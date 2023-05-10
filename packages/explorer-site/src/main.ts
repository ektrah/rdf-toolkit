window.onclick = function (ev) {
    let target = ev.target;
    while (target instanceof Element) {
        if (target.tagName === "A") {
            const href = target.getAttribute("data-href");
            const rel = target.getAttribute("rel");
            if (!rel) {
                ev.preventDefault();
                if (href) {
                    window.location.hash = href;
                }
            }
            break;
        }
        target = target.parentElement;
    }
};

document.addEventListener("DOMContentLoaded", function () {
    const iframeElement = document.getElementById("pageIframe");

    if (iframeElement) {
        window.onload = function () {
            iframeElement.setAttribute(
                "src",
                window.location.hash.substring(1)
            );
        };

        window.addEventListener("hashchange", function () {
            iframeElement.setAttribute(
                "src",
                window.location.hash.substring(1)
            );
        });

        window.dispatchEvent(new Event("hashchange"));
    }
});
