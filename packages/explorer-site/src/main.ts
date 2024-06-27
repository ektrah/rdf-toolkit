import Fuse from "fuse.js";
import treeData from "./tree.json";
import searchData from "./search.json";

let fuse: Fuse<any>;
let currentFocus = -1; // To track the focus of search results

console.log("Script started");

// Function to fetch JSON data
async function fetchJsonData(url: string) {
    console.log(`Fetching JSON data from ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    console.log(`Fetched data from ${url}:`, data);
    return data;
}

// Load tree.json and search.json
async function loadJsonFiles() {
    // Initialize Fuse.js
    console.log("Initializing Fuse.js with search data:", searchData);
    fuse = new Fuse(searchData, {
        keys: ["name", "description"],
    });

    return treeData;
}

// Function to perform search
function performSearch(query: string) {
    if (!fuse) {
        console.log("Fuse.js not initialized");
        return [];
    }
    console.log(`Performing search with query: "${query}"`);
    const results = fuse.search(query).map((result) => result.item);
    console.log("Search results:", results);
    return results;
}

// Function to update view based on search results
function updateView(searchResults: any[]) {
    console.log("Updating view with search results:", searchResults);
    const resultsDiv = document.getElementById("results") as HTMLDivElement;
    resultsDiv.innerHTML = ""; // Clear previous results

    if (searchResults.length > 0) {
        // Create a dropdown list
        const ul = document.createElement("ul");
        ul.style.listStyleType = "none";
        ul.style.padding = "0";
        ul.style.margin = "0";

        searchResults.forEach((result, index) => {
            const li = document.createElement("li");
            li.textContent = result.name; // Adjust based on your JSON structure
            li.classList.add("result-item");

            // Highlight the first item initially
            if (index === 0) {
                li.classList.add("active");
            }

            // Handle mouse click event
            li.addEventListener("click", () => {
                navigateTo(result.name);
            });

            // Handle keyboard navigation (arrow keys)
            li.addEventListener("mouseover", () => {
                currentFocus = index;
                addActiveClass(ul.children);
            });

            ul.appendChild(li);
        });

        // Display the results dropdown
        resultsDiv.style.display = "block";
        resultsDiv.appendChild(ul);
    } else {
        resultsDiv.textContent = "No results found";
        resultsDiv.style.display = "none";
    }
}

// Function to handle navigation
function navigateTo(selectedItem: string): void {
    // Replace whitespace with slashes for navigation path
    const path = selectedItem.replace(/:/g, "/");
    console.log(`Navigating to: /${path}`);
    window.location.href = `/${path}`;
}

// Add event listener to search input
function addSearchEventListener(): void {
    const searchInput = document.getElementById("search") as HTMLInputElement;
    if (searchInput) {
        console.log("Adding event listener to search input");
        searchInput.addEventListener("input", (event) => {
            console.log("Search input event triggered");
            const input = event.target as HTMLInputElement;
            const query = input.value || "";
            console.log(`Search query: "${query}"`);
            const searchResults = performSearch(query);
            updateView(searchResults);
        });
    } else {
        console.log("Search input element not found");
    }
}

// Initialize the application
async function initializeApp() {
    await loadJsonFiles();
    addSearchEventListener();
}

// Call initializeApp when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeApp);

function addActiveClass(items: HTMLCollectionOf<Element>): void {
    for (let i = 0; i < items.length; i++) {
        if (i === currentFocus) {
            (items[i] as HTMLLIElement).classList.add("active");
        } else {
            (items[i] as HTMLLIElement).classList.remove("active");
        }
    }
}

// Existing code
window.onclick = function (ev) {
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
};