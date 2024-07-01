import Fuse from "fuse.js";
import searchData from "./search.json";

interface SearchEntry {
    "id": string,
    "name": string,
    "description": string,
    "type": string
}

const fuse = new Fuse<SearchEntry>(searchData, {
    keys: ["name", "description"],
});

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search") as HTMLInputElement;
    const resultsDiv = document.getElementById("results") as HTMLDivElement;

    if (searchInput && resultsDiv) {
        searchInput.addEventListener("input", function () {
            const searchResults = fuse.search(searchInput.value);
            if (searchResults.length) {
                const ul = document.createElement("ul");
                for (const result of searchResults) {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.href = result.item.id;
                    a.dataset.href = "/" + result.item.name.replace(/:/g, "/");
                    a.textContent = result.item.name;
                    li.append(a);
                    ul.appendChild(li);
                };

                resultsDiv.replaceChildren(ul);
                resultsDiv.style.display = "block";
            } else {
                resultsDiv.textContent = "No results found";
                resultsDiv.style.display = "none";
            }
        });
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
