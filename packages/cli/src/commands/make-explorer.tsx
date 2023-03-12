import renderHTML, { HtmlContent } from "@rdf-toolkit/explorer-views/jsx/html";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import cssAssetFilePath from "../assets/explorer/explorer.min.css";
import scriptAssetFilePath from "../assets/explorer/explorer.min.js";
import fontAssetFilePath from "../assets/explorer/iosevka-aile-custom-light.woff2";
import workerScriptAssetFilePath from "../assets/explorer/worker.min.js";
import { Project } from "../project.js";
import { Site } from "../site.js";

const DEFAULT_TITLE = "RDF Explorer";
const DEFAULT_BASE = "https://example.com/";

const INDEX_FILE_NAME = "index.html";
const ERROR_FILE_NAME = "404.html";
const CSS_FILE_NAME = path.basename(cssAssetFilePath);
const FONT_FILE_NAME = path.basename(fontAssetFilePath);
const SCRIPT_FILE_NAME = path.basename(scriptAssetFilePath);
const WORKER_SCRIPT_FILE_NAME = path.basename(workerScriptAssetFilePath);

class Website {
    readonly files: Record<string, { readonly fileName: string, readonly contentType: string, readonly buffer: Buffer }> = {};

    constructor(readonly title: string, readonly baseURL: string) {
    }

    add(documentURI: string, filePath: string): void {
        const buffer = fs.readFileSync(filePath);

        this.files[documentURI] = {
            fileName: `${path.parse(filePath).name}.${crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 12)}.ttl`,
            contentType: /[.](?:md|mkdn?|mdwn|mdown|markdown)$/i.test(filePath) ? "text/markdown" : "text/turtle",
            buffer,
        };
    }
}

function renderIndex(context: Website, links: HtmlContent, scripts: HtmlContent): HtmlContent {
    return <html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>{context.title}</title>
            {links}
            <link rel="preload" type="font/woff2" href={resolveHref(FONT_FILE_NAME, context.baseURL)} as="font" crossorigin="anonymous" />
            <link rel="preload" type="application/javascript" href={resolveHref(WORKER_SCRIPT_FILE_NAME, context.baseURL)} as="worker" crossorigin="anonymous" />
            {Object.entries(context.files).map(([documentURI, item]) => <link rel="preload" type={item.contentType} href={resolveHref(item.fileName, context.baseURL)} as="fetch" crossorigin="anonymous" data-uri={documentURI} />)}
        </head>
        <body>
            <noscript>Your browser does not support JavaScript or scripts are being blocked.</noscript>
            {scripts}
        </body>
    </html>;
}

function render404(context: Website, links: HtmlContent, scripts: HtmlContent): HtmlContent {
    return <html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>Page not found &ndash; {context.title}</title>
            {links}
        </head>
        <body>
            <h1>Page not found</h1>
            <p>We are sorry, the page you requested cannot be found.</p>
            <p>The URL may be misspelled or the page you're looking for is no longer available.</p>
        </body>
    </html>;
}

function resolveHref(url: string, base: string): string {
    const root = new URL("/", base).href;
    const result = new URL(url, base).href;
    return result.startsWith(root) ? result.slice(root.length - 1) : result;
}

export default function main(args: { base: string | undefined, output: string | undefined, project: string }): void {
    const moduleFilePath = url.fileURLToPath(import.meta.url);
    const modulePath = path.dirname(moduleFilePath);

    const project = Project.from(args.project);
    const files = project.config.files || {};
    const icons = project.config.siteOptions?.icons || [];
    const assets = project.config.siteOptions?.assets || {};
    const context = new Website(project.config.siteOptions?.title || DEFAULT_TITLE, new URL(args.base || project.config.siteOptions?.baseURL || DEFAULT_BASE, DEFAULT_BASE).href);
    const site = new Site(project, args.output);

    for (const documentURI in files) {
        context.add(documentURI, project.resolve(files[documentURI]));
    }

    const links = <>
        {icons.map(iconConfig => <link rel="icon" type={iconConfig.type} sizes={iconConfig.sizes} href={resolveHref(path.basename(iconConfig.asset), context.baseURL)} />)}
        <link rel="stylesheet" href={resolveHref(CSS_FILE_NAME, context.baseURL)} />
    </>;

    const scripts = <>
        <script src={resolveHref(SCRIPT_FILE_NAME, context.baseURL)}></script>
    </>;

    site.writeFile(CSS_FILE_NAME, fs.readFileSync(path.resolve(modulePath, cssAssetFilePath)));
    site.writeFile(FONT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, fontAssetFilePath)));
    site.writeFile(SCRIPT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, scriptAssetFilePath)));
    site.writeFile(WORKER_SCRIPT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, workerScriptAssetFilePath)));

    for (const iconConfig of icons) {
        site.writeFile(path.basename(iconConfig.asset), project.readFile(iconConfig.asset));
    }

    for (const filePath in assets) {
        site.writeFile(assets[filePath], project.readFile(filePath));
    }

    site.writeFile(INDEX_FILE_NAME, Buffer.from("<!DOCTYPE html>\n" + renderHTML(renderIndex(context, links, scripts))));
    site.writeFile(ERROR_FILE_NAME, Buffer.from("<!DOCTYPE html>\n" + renderHTML(render404(context, links, scripts))));

    for (const item of Object.values(context.files)) {
        site.writeFile(item.fileName, item.buffer);
    }
}
