import Fuse from 'fuse.js';

let fuse: Fuse<any>;

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
  const treeData = await fetchJsonData('tree.json');
  const searchData = await fetchJsonData('search.json');

  // Initialize Fuse.js
  console.log("Initializing Fuse.js with search data:", searchData);
  fuse = new Fuse(searchData, {
    keys: ['name', 'description']
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
  const results = fuse.search(query).map(result => result.item);
  console.log("Search results:", results);
  return results;
}

// Function to update view based on search results
function updateView(searchResults: any[], treeData: any) {
  console.log("Updating view with search results:", searchResults);
  // For simplicity, we will show a pop-up alert with the search results.
  // This will be replaced with actual UI updates later.
  if (searchResults.length > 0) {
    alert(`Search results:\n${searchResults.map(result => result.name).join('\n')}`);
  } else {
    alert("No results found");
  }
}

// Add event listener to search input
function addSearchEventListener(treeData: any) {
  const searchInput = document.getElementById("search") as HTMLInputElement;
  if (searchInput) {
    console.log("Adding event listener to search input");
    searchInput.addEventListener("input", (event) => {
      console.log("Search input event triggered");
      const input = event.target as HTMLInputElement;
      const query = input?.value || "";
      console.log(`Search query: "${query}"`);
      const searchResults = performSearch(query);
      updateView(searchResults, treeData);
    });
  } else {
    console.log("Search input element not found");
  }
}

// Initialize the application
async function initializeApp() {
  console.log("Initializing application");
  const treeData = await loadJsonFiles();
  addSearchEventListener(treeData);
}

// Call initializeApp when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeApp);

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
