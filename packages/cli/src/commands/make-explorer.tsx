import renderHTML, { HtmlContent } from "@rdf-toolkit/explorer-views/jsx/html";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import cssAssetFilePath from "../assets/explorer/explorer.min.css";
import scriptAssetFilePath from "../assets/explorer/explorer.min.js";
import fontAssetFilePath from "../assets/explorer/iosevka-aile-custom-light.woff2";
import workerScriptAssetFilePath from "../assets/explorer/worker.min.js";
import { Ontology } from "../model/ontology.js";
import { Project } from "../model/project.js";
import { MakeOptions, ProjectOptions } from "../options.js";
import { Workspace } from "../workspace.js";

type Options =
    & MakeOptions
    & ProjectOptions

const DEFAULT_TITLE = "RDF Explorer";

const INDEX_FILE_NAME = "index.html";
const CSS_FILE_NAME = path.basename(cssAssetFilePath);
const FONT_FILE_NAME = path.basename(fontAssetFilePath);
const SCRIPT_FILE_NAME = path.basename(scriptAssetFilePath);
const WORKER_SCRIPT_FILE_NAME = path.basename(workerScriptAssetFilePath);

class Website {
    readonly files: Record<string, { readonly fileName: string, readonly contentType: string, readonly buffer: Buffer }> = {};

    constructor(readonly title: string) {
    }

    add(ontology: Ontology): void {
        this.files[ontology.documentURI] = {
            fileName: [path.parse(ontology.filePath).name, crypto.createHash("sha256").update(ontology.buffer).digest("hex").slice(0, 12), ontology.fileExtension].join("."),
            contentType: ontology.contentType,
            buffer: ontology.buffer,
        };
    }
}

function renderIndex(context: Website, links: HtmlContent, scripts: HtmlContent): HtmlContent {
    return <html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>{context.title}</title>
            {links}
            <link rel="preload" type="font/woff2" href={FONT_FILE_NAME} as="font" crossorigin="anonymous" />
            {Object.entries(context.files).map(([documentURI, item]) => <link rel="preload" type={item.contentType} href={item.fileName} as="fetch" crossorigin="anonymous" data-uri={documentURI} />)}
        </head>
        <body>
            <noscript>Your browser does not support JavaScript or scripts are being blocked.</noscript>
            {scripts}
        </body>
    </html>;
}

export default function main(options: Options): void {
    const moduleFilePath = url.fileURLToPath(import.meta.url);
    const modulePath = path.dirname(moduleFilePath);

    const project = new Project(options.project);
    const icons = project.json.siteOptions?.icons || [];
    const assets = project.json.siteOptions?.assets || {};
    const context = new Website(project.json.siteOptions?.title || DEFAULT_TITLE);
    const site = new Workspace(project.package.resolve(options.output || project.json.siteOptions?.outDir || "public"));

    for (const ontology of project.files.values()) {
        if (ontology) {
            context.add(ontology);
        }
    }

    const links = <>
        {icons.map(iconConfig => <link rel="icon" type={iconConfig.type} sizes={iconConfig.sizes} href={path.basename(iconConfig.asset)} />)}
        <link rel="stylesheet" href={CSS_FILE_NAME} />
    </>;

    const scripts = <>
        <script src={SCRIPT_FILE_NAME}></script>
    </>;

    site.write(CSS_FILE_NAME, fs.readFileSync(path.resolve(modulePath, cssAssetFilePath)));
    site.write(FONT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, fontAssetFilePath)));
    site.write(SCRIPT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, scriptAssetFilePath)));
    site.write(WORKER_SCRIPT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, workerScriptAssetFilePath)));

    for (const iconConfig of icons) {
        site.write(path.basename(iconConfig.asset), project.package.read(iconConfig.asset));
    }

    for (const assetPath in assets) {
        site.write(assets[assetPath], project.package.read(assetPath));
    }

    site.write(INDEX_FILE_NAME, Buffer.from("<!DOCTYPE html>\n" + renderHTML(renderIndex(context, links, scripts))));

    for (const item of Object.values(context.files)) {
        site.write(item.fileName, item.buffer);
    }
}
