/*!
 *  _____ ____  _____
 * | __  |    \|   __|
 * |    -|  |  |   __|
 * |__|__|____/|__|   Explorer
 *
 * Copyright (c) 2023 Siemens AG
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Backend, Frontend, WorkerChannel } from "@rdf-toolkit/explorer-shared";
import "./main.css";
import "./worker/worker.min.css";
import workerScriptURL from "./worker/worker.min.js";

if (!window.Worker) {
    document.write("Your browser doesn't support web workers.");
}
else if (!window.crypto || !window.crypto.subtle) {
    document.write("Your browser doesn't support cryptography.");
}
else if (!window.TextDecoder) {
    document.write("Your browser doesn't support text encoding.");
}
else if (typeof BigInt !== "function") {
    document.write("Your browser doesn't support big integers.");
}
else if (typeof fetch !== "function") {
    document.write("Your browser doesn't support the Fetch API.");
}
else {
    const navWidthStorageKey = "navWidth";
    const documentTitle = document.title;
    const worker = new Worker(workerScriptURL);
    const navigationPane = document.createElement("nav");
    const navigationDivider = document.createElement("div");
    const mainContent = document.createElement("main");
    const dialog = document.createElement("dialog");
    const dialogContent = document.createElement("div");
    const closeButton = document.createElement("button");
    const loader = document.createElement("div");
    const progress = document.createElement("div");

    navigationDivider.className = "nav-divider";
    progress.className = "progress-bar";
    loader.className = "loader-box";
    loader.innerHTML = "<div class='loader'></div>";
    closeButton.innerHTML = "<svg viewBox='0 0 10 10' xmlns='http://www.w3.org/2000/svg' version='1.0'><line x1='2' y1='2' x2='8' y2='8' /><line x1='2' y1='8' x2='8' y2='2' /></svg>";
    dialog.replaceChildren(closeButton, loader, dialogContent);
    document.body.replaceChildren(navigationPane, navigationDivider, mainContent, dialog, progress);
    dialog.showModal();

    function setLayoutsSize(clientX: number) { // eslint-disable-line no-inner-declarations
        const width = Math.min(Math.max(clientX - 4, window.innerWidth * 0.15), window.innerWidth * 0.85) + "px";

        navigationDivider.style.left = width;
        navigationPane.style.width = width;
        mainContent.style.marginLeft = width;

        if (window.localStorage) {
            window.localStorage.setItem(navWidthStorageKey, width);
        }
    }

    const frontend: Frontend = {

        showDialog(innerHTML) {
            dialogContent.innerHTML = innerHTML;
            loader.style.display = "none";
            if (!dialog.open) {
                dialog.showModal();
            }
        },

        showProgress(message) {
            const content = document.createElement("p");
            content.style.textAlign = "center";
            content.innerText = message;
            dialogContent.replaceChildren(content);
            loader.style.display = "block";
            if (!dialog.open) {
                dialog.showModal();
            }
        },

        hideProgress() {
            if (dialog.open) {
                dialog.close();
            }
        },

        replaceNavigation(innerHTML) {
            navigationPane.innerHTML = innerHTML;
        },

        replaceMainContent(title, innerHTML) {
            window.scrollTo(0, 0);
            mainContent.innerHTML = innerHTML;
            document.title = title ? documentTitle + " \u00B7 " + title : documentTitle;
            progress.className = "progress-bar loaded";
        },
    };

    const backend: Backend = WorkerChannel.connect<Frontend, Backend>(worker, () => frontend);

    let unsavedChanges = false;

    worker.onerror = window.onunhandledrejection = window.onerror = function () {
        progress.className = "progress-bar loaded";
        frontend.showDialog("<p>Oops!</p><p>Something went wrong.</p><p>Please check the developer console for more information.</p>");
    }

    closeButton.onclick = function () {
        frontend.hideProgress();
    }

    navigationDivider.onmousedown = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        document.onmousemove = function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            setLayoutsSize(ev.clientX);
        };
    };

    navigationDivider.ontouchstart = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        document.ontouchmove = function (ev) {
            ev.stopPropagation();
            ev.preventDefault();

            if (ev.touches.length) {
                setLayoutsSize(ev.touches[0].clientX);
            }
        };
    };

    document.onmouseup = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        document.onmousemove = null;
    };

    document.ontouchend = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        document.ontouchmove = null;
    };

    window.onclick = function (ev) {
        let target = ev.target;
        while (target instanceof Element) {
            if (target.tagName === "A") {
                const href = target.getAttribute("href");
                const rel = target.getAttribute("rel");
                if (!rel) {
                    ev.preventDefault();
                    window.location.hash = href ? "#" + href : "";
                }
                break;
            }
            target = target.parentElement;
        }
    }

    window.ondragstart = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }

    window.ondragenter = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }

    window.ondragover = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();

        if (ev.dataTransfer) {
            ev.dataTransfer.dropEffect = "copy";
        }
    }

    window.ondragleave = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
    }

    window.ondrop = async function (ev) {
        ev.preventDefault();

        progress.className = "progress-bar loading";
        backend.beforecompile();

        const documents: { readonly uri: string, readonly language: string, readonly arrayBuffer: Promise<ArrayBuffer> }[] = [];

        if (ev.dataTransfer) {
            for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                const file = ev.dataTransfer.items[i].getAsFile();
                if (file) {
                    documents.push({
                        uri: new URL("file:///" + file.name).href,
                        language: /[.](?:md|mkdn?|mdwn|mdown|markdown)$/i.test(file.name) ? "markdown" : "turtle",
                        arrayBuffer: file.arrayBuffer()
                    });
                }
            }
        }

        for (const document of documents) {
            const sourceText = await document.arrayBuffer;
            const sourceTextHash = await crypto.subtle.digest("SHA-256", sourceText);
            backend.compile(document.uri, sourceText, sourceTextHash, document.language);
            unsavedChanges = true;
        }

        backend.aftercompile();
        backend.navigateTo(location.hash.startsWith("#") ? location.hash.slice("#".length) : "");
    }

    window.onhashchange = function () {
        progress.className = "progress-bar loading";
        backend.navigateTo(location.hash.startsWith("#") ? location.hash.slice("#".length) : "");
    }

    window.onbeforeunload = function (ev) {
        if (unsavedChanges) {
            ev.preventDefault();
            return ev.returnValue = "Are you sure you want to exit?";
        }
        else {
            return undefined;
        }
    }

    window.onload = async function () {
        if (history.scrollRestoration) {
            history.scrollRestoration = "manual";
        }

        if (document.fonts) {
            await document.fonts.load("300 17px \"Iosevka Aile Custom\"", "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        }

        if (window.localStorage) {
            const navWidth = Number.parseInt(window.localStorage.getItem(navWidthStorageKey) || "");
            if (!Number.isNaN(navWidth)) {
                setLayoutsSize(navWidth);
            }
        }

        progress.className = "progress-bar loading";
        backend.beforecompile();

        const documents: { readonly uri: string, readonly language: string, readonly response: Promise<Response> }[] = [];

        const links = document.getElementsByTagName("link");
        for (let i = 0; i < links.length; i++) {
            const link = links.item(i);
            if (link && (link.type === "text/turtle" || link.type === "text/markdown")) {
                documents.push({
                    uri: new URL(link.dataset["uri"] || link.href, document.location.href).href,
                    language: link.type === "text/markdown" ? "markdown" : "turtle",
                    response: fetch(new URL(link.href, document.location.href))
                });
            }
        }

        for (const document of documents) {
            const response = await document.response;
            if (!response.ok) continue;
            const sourceText = await response.arrayBuffer();
            const sourceTextHash = await crypto.subtle.digest("SHA-256", sourceText);
            backend.compile(document.uri, sourceText, sourceTextHash, document.language);
        }

        backend.aftercompile();
        backend.navigateTo(location.hash.startsWith("#") ? location.hash.slice("#".length) : "");
    }
}
