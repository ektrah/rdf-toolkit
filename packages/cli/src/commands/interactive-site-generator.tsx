import renderHTML, { HtmlContent } from "@rdf-toolkit/explorer-views/jsx/html";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as url from "url";
import cssAssetFilePath from "../assets/explorer/explorer.min.css";
import scriptAssetFilePath from "../assets/explorer/explorer.min.js";
import fontAssetFilePath from "../assets/explorer/iosevka-aile-custom-light.woff2";
import workerScriptAssetFilePath from "../assets/explorer/worker.min.js";
import { ProjectConfig } from "../configuration.js";
import { Site } from "../site.js";

const DEFAULT_TITLE = "RDF Explorer";
const DEFAULT_OUTPUT = "./public/";
const DEFAULT_BASE = "https://example.com/";

const HOME_FILE_NAME = "index.html";
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

function renderHome(context: Website, links: HtmlContent, scripts: HtmlContent): HtmlContent {
    return <html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>{context.title}</title>
            {links}
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

    const configFilePath = args.project;
    const configPath = path.dirname(configFilePath);
    const config = JSON.parse(fs.readFileSync(configFilePath, { encoding: "utf-8" }));

    if (!ProjectConfig.is(config)) {
        throw new Error("Invalid project file");
    }

    config.files ||= {};
    config.siteOptions ||= {};
    config.siteOptions.title ||= DEFAULT_TITLE;
    config.siteOptions.icons ||= [];
    config.siteOptions.assets ||= {};
    config.siteOptions.baseURL = new URL(args.base || config.siteOptions.baseURL || DEFAULT_BASE, DEFAULT_BASE).href;
    config.siteOptions.outDir = args.output || config.siteOptions.outDir || DEFAULT_OUTPUT;

    const context = new Website(config.siteOptions.title, config.siteOptions.baseURL);

    {
        for (const documentURI in config.files) {
            context.add(documentURI, path.resolve(configPath, config.files[documentURI]));
        }
    }

    const links = <>
        {config.siteOptions.icons.map(iconConfig => <link rel="icon" type={iconConfig.type} sizes={iconConfig.sizes} href={resolveHref(iconConfig.file, context.baseURL)} />)}
        <link rel="stylesheet" href={resolveHref(CSS_FILE_NAME, context.baseURL)} />
    </>;

    const scripts = <>
        <script src={resolveHref(SCRIPT_FILE_NAME, context.baseURL)}></script>
    </>;

    {
        const site = new Site(configPath, config.siteOptions.outDir);

        site.writeFile(CSS_FILE_NAME, fs.readFileSync(path.resolve(modulePath, cssAssetFilePath)));
        site.writeFile(FONT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, fontAssetFilePath)));
        site.writeFile(SCRIPT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, scriptAssetFilePath)));
        site.writeFile(WORKER_SCRIPT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, workerScriptAssetFilePath)));

        for (const iconConfig of config.siteOptions.icons) {
            site.writeFile(path.basename(iconConfig.file), fs.readFileSync(path.resolve(configPath, iconConfig.file)));
        }

        for (const filePath in config.siteOptions.assets) {
            site.writeFile(config.siteOptions.assets[filePath], fs.readFileSync(path.resolve(configPath, filePath)));
        }

        site.writeFile(HOME_FILE_NAME, Buffer.from("<!DOCTYPE html>\n" + renderHTML(renderHome(context, links, scripts))));
        site.writeFile(ERROR_FILE_NAME, Buffer.from("<!DOCTYPE html>\n" + renderHTML(render404(context, links, scripts))));

        for (const item of Object.values(context.files)) {
            site.writeFile(item.fileName, item.buffer);
        }
    }
}
