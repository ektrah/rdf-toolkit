#!/usr/bin/env node

import { RenderContext } from "@rdf-toolkit/explorer-views/context";
import renderHTML, { HtmlContent } from "@rdf-toolkit/explorer-views/jsx/html";
import renderMain from "@rdf-toolkit/explorer-views/pages/main";
import renderNavigation from "@rdf-toolkit/explorer-views/pages/navigation";
import renderFooter from "@rdf-toolkit/explorer-views/sections/footer";
import { Ix } from "@rdf-toolkit/iterable";
import { Graph } from "@rdf-toolkit/rdf/graphs";
import { BlankNode, IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { Schema } from "@rdf-toolkit/schema";
import { DiagnosticBag, TextDocument } from "@rdf-toolkit/text";
import { SyntaxTree } from "@rdf-toolkit/turtle";
import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import fontFileName from "./fonts/iosevka-aile-custom-light.woff2";
import "./main.css";
import { PrefixTable } from "./prefixes.js";
import scriptFileName from "./scripts/explorer.asset.js";

interface IconConfig {
    readonly type: string;
    readonly sizes?: string;
    readonly file: string;
}

namespace IconConfig {

    export function is(value: any): value is IconConfig {
        const candidate = value as IconConfig;
        return typeof candidate !== "undefined"
            && typeof candidate.type === "string"
            && (typeof candidate.sizes === "undefined" || typeof candidate.sizes === "string")
            && typeof candidate.file === "string"
            ? true : false;
    }
}

interface SiteConfig {
    readonly title: string;
    readonly icons: ReadonlyArray<IconConfig>;
    readonly sources: Readonly<Record<string, string>>;
    readonly assets: Readonly<Record<string, string>>;
    readonly outDir: string;
    readonly baseURL: string;
}

namespace SiteConfig {

    export function is(value: any): value is SiteConfig {
        const candidate = value as SiteConfig;
        return typeof candidate !== "undefined"
            && typeof candidate.title === "string"
            && Array.isArray(candidate.icons) && candidate.icons.every(IconConfig.is)
            && candidate.sources !== null && typeof candidate.sources === "object"
            && candidate.assets !== null && typeof candidate.assets === "object"
            && typeof candidate.outDir === "string"
            && typeof candidate.baseURL === "string"
            ? true : false;
    }
}

class Website implements RenderContext {
    readonly dataset: ParsedTriple[][] = [];
    readonly diagnostics: DiagnosticBag = DiagnosticBag.create();
    readonly documents: Record<string, TextDocument> = {};

    readonly namespaces: Record<string, string>[] = [{
        "_": "http://example.com/.well-known/genid/",
        "dc11": "http://purl.org/dc/elements/1.1/",
        "dcmitype": "http://purl.org/dc/dcmitype/",
        "dcterms": "http://purl.org/dc/terms/",
        "owl": "http://www.w3.org/2002/07/owl#",
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "sh": "http://www.w3.org/ns/shacl#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
    }];

    graph: Graph;
    schema: Schema;
    prefixes: PrefixTable;

    readonly outputs: Record<string, string> = {};

    constructor(readonly title: string, readonly baseURL: string) {
        this.graph = Graph.from(this.dataset);
        this.schema = Schema.decompile(this.dataset, this.graph);
        this.prefixes = new PrefixTable(this.namespaces);
    }

    lookupPrefixedName(iri: string): { readonly prefixLabel: string; readonly localName: string; } | null {
        return this.prefixes.lookup(iri);
    }

    rewriteHrefAsData(iri: string): string | undefined {
        const result: string | undefined = this.outputs[iri];
        return result ? resolveHref(result, this.baseURL) : undefined;
    }

    beforecompile(): void {
    }

    compile(documentURI: string, filePath: string): void {
        const document = this.documents[documentURI] = TextDocument.create(documentURI, "turtle", 0, fs.readFileSync(filePath, { encoding: "utf-8" }));
        const syntaxTree = SyntaxTree.parse(document, this.diagnostics);
        if (this.diagnostics.errors === 0) {
            const parserState = SyntaxTree.compileTriples(syntaxTree, this.diagnostics, { returnParserState: true });
            if (this.diagnostics.errors === 0) {
                this.dataset.push(parserState.triples);
                this.namespaces.push(parserState.namespaces);
            }
        }
    }

    aftercompile(): void {
        if (this.diagnostics.errors === 0) {
            this.graph = Graph.from(this.dataset);
            this.schema = Schema.decompile(this.dataset, this.graph);
            this.prefixes = new PrefixTable(this.namespaces);

            const terms = Ix.from(this.schema.classes.keys())
                .concat(this.schema.properties.keys())
                .concat(this.schema.ontologies.keys())
                .concat(Object.keys(this.documents).map(IRI.create))
                .toSet();

            for (const term of terms) {
                const prefixedName = this.prefixes.lookup(term.value);
                if (prefixedName) {
                    this.outputs[term.value] = path.join(prefixedName.prefixLabel, prefixedName.localName);
                }
                else {
                    const string = term.value;
                    let hash = 0;
                    for (let i = 0; i < string.length; i++) {
                        const char = string.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    this.outputs[term.value] = (hash & ((1 << 31) - 1)).toString().padStart(10, "0");
                }
            }
        }
    }
}

function renderHome(context: Website, head: HtmlContent, navigation: HtmlContent): string {
    return "<!DOCTYPE html>\n" + renderHTML(<html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>{context.title}</title>
            {head}
        </head>
        <body>
            <nav>
                {navigation}
            </nav>
            <main>
                <section>
                    <h1>{context.title}</h1>
                </section>
                <footer>
                    {renderFooter(context)}
                </footer>
            </main>
        </body>
    </html>);
}

function render404(context: Website, head: HtmlContent, navigation: HtmlContent): string {
    return "<!DOCTYPE html>\n" + renderHTML(<html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>Page not found &ndash; {context.title}</title>
            {head}
        </head>
        <body>
            <nav>
                {navigation}
            </nav>
            <main>
                <section>
                    <h1>Page not found</h1>
                    <p>We are sorry, the page you requested cannot be found.</p>
                    <p>The URL may be misspelled or the page you're looking for is no longer available.</p>
                </section>
                <footer>
                    {renderFooter(context)}
                </footer>
            </main>
        </body>
    </html>);
}

function renderPage(iri: string, context: Website, head: HtmlContent, navigation: HtmlContent): string {
    const subject: IRIOrBlankNode = iri.startsWith("http://example.com/.well-known/genid/")
        ? BlankNode.create(iri.substr("http://example.com/.well-known/genid/".length))
        : IRI.create(iri);

    const prefixedName = context.lookupPrefixedName(subject.value);
    const title = prefixedName ? prefixedName.prefixLabel + ":" + prefixedName.localName : "<" + subject.value + ">";

    const main = renderMain(subject, iri in context.documents ? context.documents[iri] : null, context);

    return "<!DOCTYPE html>\n" + renderHTML(<html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>{title} &ndash; {context.title}</title>
            {head}
        </head>
        <body>
            <nav>
                {navigation}
            </nav>
            <main>
                {main}
            </main>
        </body>
    </html>);
}

const sentinelBaseURL = "https://127.0.0.1/";

function resolveHref(url: string, base: string): string {
    const result = new URL(url, base).href;
    return result.startsWith(sentinelBaseURL) ? result.substring(sentinelBaseURL.length - 1) : result;
}

function main(args: readonly string[]): number {
    const configFilePath = path.resolve(args[2] || "./siteconfig.json");
    const configPath = path.dirname(configFilePath);
    const config = JSON.parse(fs.readFileSync(configFilePath, { encoding: "utf-8" }));

    if (!SiteConfig.is(config)) {
        return 1;
    }

    const baseURL = new URL(config.baseURL, sentinelBaseURL).href;
    const outDir = path.resolve(configPath, config.outDir);
    const homeFileName = "index.html";
    const errorFileName = "404.html";
    const cssFileName = "style.css";

    const diagnostics = DiagnosticBag.create();
    const context = new Website(config.title, baseURL);

    context.beforecompile();
    for (const documentURI in config.sources) {
        context.compile(documentURI, path.resolve(configPath, config.sources[documentURI]));
    }
    context.aftercompile();

    for (const [documentURI, diagnostic] of diagnostics) {
        console.dir(diagnostic);
    }

    if (diagnostics.errors) {
        return 1;
    }

    const head = <>
        {config.icons.map(iconConfig => <link rel="icon" type={iconConfig.type} sizes={iconConfig.sizes} href={resolveHref(iconConfig.file, context.baseURL)} />)}
        <link rel="stylesheet" href={resolveHref(cssFileName, context.baseURL)} />
        <script src={resolveHref(scriptFileName, context.baseURL)}></script>
    </>;

    const navigation = renderNavigation(config.title, context);

    {
        const cssFilePath = path.join(outDir, cssFileName);
        console.log(cssFilePath);
        const css = fs.readFileSync(path.format({ ...path.parse(args[1]), base: "", ext: ".css" }));
        fs.mkdirSync(path.dirname(cssFilePath), { recursive: true });
        fs.writeFileSync(cssFilePath, css);
    }

    {
        const scriptFilePath = path.join(outDir, scriptFileName);
        console.log(scriptFilePath);
        const script = fs.readFileSync(path.format({ ...path.parse(args[1]), base: scriptFileName }));
        fs.mkdirSync(path.dirname(scriptFilePath), { recursive: true });
        fs.writeFileSync(scriptFilePath, script);
    }

    {
        const fontFilePath = path.join(outDir, fontFileName);
        console.log(fontFilePath);
        const font = fs.readFileSync(path.format({ ...path.parse(args[1]), base: fontFileName }));
        fs.mkdirSync(path.dirname(fontFilePath), { recursive: true });
        fs.writeFileSync(fontFilePath, font);
    }

    for (const iconConfig of config.icons) {
        const iconFilePath = path.join(outDir, iconConfig.file);
        console.log(iconFilePath);
        const icon = fs.readFileSync(path.resolve(configPath, iconConfig.file));
        fs.mkdirSync(path.dirname(iconFilePath), { recursive: true });
        fs.writeFileSync(iconFilePath, icon);
    }

    for (const filePath in config.assets) {
        const assetFilePath = path.join(outDir, config.assets[filePath]);
        console.log(assetFilePath);
        const asset = fs.readFileSync(path.resolve(configPath, filePath));
        fs.mkdirSync(path.dirname(assetFilePath), { recursive: true });
        fs.writeFileSync(assetFilePath, asset);
    }

    {
        const homeFilePath = path.join(outDir, homeFileName);
        console.log(homeFilePath);
        const home = renderHome(context, head, navigation);
        fs.mkdirSync(path.dirname(homeFilePath), { recursive: true });
        fs.writeFileSync(homeFilePath, home);
    }

    {
        const errorFilePath = path.join(outDir, errorFileName);
        console.log(errorFilePath);
        const error = render404(context, head, navigation);
        fs.mkdirSync(path.dirname(errorFilePath), { recursive: true });
        fs.writeFileSync(errorFilePath, error);
    }

    for (const iri in context.outputs) {
        const pageFilePath = path.join(outDir, context.outputs[iri] + ".html");
        console.log(pageFilePath);
        const page = renderPage(iri, context, head, navigation);
        fs.mkdirSync(path.dirname(pageFilePath), { recursive: true });
        fs.writeFileSync(pageFilePath, page);
    }

    return 0;
}

process.exit(main(process.argv));

/*

Example configuration:

    {
        "title": "RDF Explorer",
        "icons": [
            {
                "type": "image/png",
                "sizes": "32x32",
                "file": "./favicon32.png"
            },
            {
                "type": "image/png",
                "sizes": "16x16",
                "file": "./favicon16.png"
            }
        ],
        "sources": {
            "http://www.w3.org/1999/02/22-rdf-syntax-ns": "./vocab/rdf.ttl",
            "http://www.w3.org/2000/01/rdf-schema": "./vocab/rdfs.ttl",
            "http://www.w3.org/2001/XMLSchema": "./vocab/xsd.ttl",
            "http://www.w3.org/2002/07/owl": "./vocab/owl.ttl",
            "http://www.w3.org/ns/shacl": "./vocab/shacl.ttl"
        },
        "assets": {
            "./robots.txt": "robots.txt"
        },
        "outDir": "./public/",
        "baseURL": "/"
    }

*/
