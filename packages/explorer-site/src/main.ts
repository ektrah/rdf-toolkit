import Fuse from "fuse.js";

interface SearchEntry {
    readonly "href"?: string;
    readonly "id": string;
    readonly "name": string;
    readonly "description"?: string;
}

document.addEventListener("DOMContentLoaded", async function () {
    const links = document.getElementsByTagName("link");
    const searchInput = document.getElementById("search") as HTMLInputElement;
    const resultsDiv = document.getElementById("results") as HTMLDivElement;

    if (searchInput && resultsDiv) {
        for (let i = 0; i < links.length; i++) {
            const link = links.item(i);
            if (link && link.rel === "preload" && link.type === "application/json" && link.as === "fetch") {
                const response = await fetch(new URL(link.href, document.location.href).href);
                const searchData = await response.json() as ReadonlyArray<SearchEntry>;
                const fuse = new Fuse<SearchEntry>(searchData, { keys: ["name", "description"] });

                searchInput.addEventListener("input", function () {
                    const searchResults = fuse.search(searchInput.value);
                    const ul = document.createElement("ul");
                    if (searchResults.length) {
                        for (const result of searchResults) {
                            const li = document.createElement("li");
                            const a = document.createElement("a");
                            a.href = result.item.id;
                            a.dataset.href = result.item.href;
                            a.textContent = result.item.name;
                            li.append(a);
                            ul.appendChild(li);
                        }
                    } else {
                        const li = document.createElement("li");
                        li.textContent = "No results found";
                        ul.appendChild(li);
                    }
                    resultsDiv.replaceChildren(ul);
                });
            }
        }
    }
});

window.addEventListener("click", function (ev) {
    let target = ev.target;
    while (target instanceof Element) {
        if (target.tagName === "A") {
            const href = target.getAttribute("data-href");
            const rel = target.getAttribute("rel");
            if (!rel) {
                ev.preventDefault();
                if (href) {
                    window.location.href = href;
                }
            }
            break;
        }
        target = target.parentElement;
    }
});
