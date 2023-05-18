import { RenderContext } from "@rdf-toolkit/explorer-views/context";
import renderHTML, { HtmlContent } from "@rdf-toolkit/explorer-views/jsx/html";
import renderMain from "@rdf-toolkit/explorer-views/pages/main";
import renderNavigation from "@rdf-toolkit/explorer-views/pages/navigation";
import renderFooter from "@rdf-toolkit/explorer-views/sections/footer";
import renderRDFPrefixes from "@rdf-toolkit/explorer-views/sections/rdf-prefixes";
import { Ix } from "@rdf-toolkit/iterable";
import { Graph } from "@rdf-toolkit/rdf/graphs";
import { BlankNode, IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { Schema } from "@rdf-toolkit/schema";
import { DiagnosticBag, TextDocument } from "@rdf-toolkit/text";
import { SyntaxTree } from "@rdf-toolkit/turtle";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import fontAssetFilePath from "../assets/fonts/iosevka-aile-custom-light.woff2";
import scriptAssetFilePath from "../assets/scripts/site.min.js";
import { printDiagnosticsAndExitOnError } from "../diagnostics.js";
import { Project } from "../model/project.js";
import { TextFile } from "../model/textfile.js";
import { DiagnosticOptions, MakeOptions, ProjectOptions, SiteOptions } from "../options.js";
import { PrefixTable } from "../prefixes.js";
import { Workspace } from "../workspace.js";

type Options =
    & DiagnosticOptions
    & MakeOptions
    & ProjectOptions
    & SiteOptions

const DEFAULT_TITLE = "RDF Explorer";
const DEFAULT_BASE = "https://example.com/";

const INDEX_FILE_NAME = "index.html";
const ERROR_FILE_NAME = "404.html";
const CSS_FILE_NAME = "style.css";
const FONT_FILE_NAME = path.basename(fontAssetFilePath);
const SCRIPT_FILE_NAME = path.basename(scriptAssetFilePath);

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
    readonly rootClasses: ReadonlySet<string> | null;

    constructor(readonly title: string, readonly baseURL: string, readonly appendHtmlSuffix: boolean, rootClasses?: Iterable<string>) {
        this.graph = Graph.from(this.dataset);
        this.schema = Schema.decompile(this.dataset, this.graph);
        this.prefixes = new PrefixTable(this.namespaces);
        this.rootClasses = rootClasses ? new Set(rootClasses) : null;
    }

    getPrefixes(): ReadonlyArray<[string, string]> {
        return this.prefixes.all();
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

    compile(file: TextFile): void {
        this.documents[file.documentURI] = file.document;
        const syntaxTree = file.syntaxTree;
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
                    this.outputs[term.value] = path.join(prefixedName.prefixLabel, prefixedName.localName) + (this.appendHtmlSuffix ? ".html" : "");
                }
                else {
                    const string = term.value;
                    let hash = 0;
                    for (let i = 0; i < string.length; i++) {
                        const char = string.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    this.outputs[term.value] = (hash & ((1 << 31) - 1)).toString().padStart(10, "0") + (this.appendHtmlSuffix ? ".html" : "");
                }
            }
        }
    }
}

function renderIndex(context: Website, links: HtmlContent, scripts: HtmlContent, navigation: HtmlContent): HtmlContent {
    return <html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>{context.title}</title>
            {links}
            {scripts}
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
                    {renderRDFPrefixes(context)}
                    {renderFooter(context)}
                </footer>
            </main>
        </body>
    </html>;
}

function render404(context: Website, links: HtmlContent, scripts: HtmlContent, navigation: HtmlContent): HtmlContent {
    return <html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>Page not found &ndash; {context.title}</title>
            {links}
            {scripts}
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
    </html>;
}

function renderPage(iri: string, context: Website, links: HtmlContent, scripts: HtmlContent, navigation: HtmlContent): HtmlContent {
    const subject: IRIOrBlankNode = iri.startsWith("http://example.com/.well-known/genid/")
        ? BlankNode.create(iri.slice("http://example.com/.well-known/genid/".length))
        : IRI.create(iri);

    const prefixedName = context.lookupPrefixedName(subject.value);
    const title = prefixedName ? prefixedName.prefixLabel + ":" + prefixedName.localName : "<" + subject.value + ">";

    const main = renderMain(subject, iri in context.documents ? context.documents[iri] : null, context);

    return <html lang="en-US">
        <head>
            <meta charset="utf-8" />
            <title>{title} &ndash; {context.title}</title>
            {links}
            {scripts}
        </head>
        <body>
            <nav>
                {navigation}
            </nav>
            <main>
                {main}
            </main>
        </body>
    </html>;
}

function resolveHref(url: string, base: string): string {
    const root = new URL("/", base).href;
    const result = new URL(url, base).href;
    return result.startsWith(root) ? result.slice(root.length - 1) : result;
}

export default function main(options: Options): void {
    const moduleFilePath = url.fileURLToPath(import.meta.url);
    const modulePath = path.dirname(moduleFilePath);

    const project = new Project(options.project);
    const icons = project.json.siteOptions?.icons || [];
    const assets = project.json.siteOptions?.assets || {};

    const context = new Website(project.json.siteOptions?.title || DEFAULT_TITLE, new URL(options.base || project.json.siteOptions?.baseURL || DEFAULT_BASE, DEFAULT_BASE).href, !!project.json.siteOptions?.appendHtmlSuffix, project.json.siteOptions?.roots);
    const site = new Workspace(project.package.resolve(options.output || project.json.siteOptions?.outDir || "public"));

    context.beforecompile();
    for (const fileSet of project.files.values()) {
        const file = Ix.from(fileSet).singleOrDefault(null);
        if (file) {
            context.compile(file);
        }
    }
    context.aftercompile();

    printDiagnosticsAndExitOnError(project.diagnostics, options);

    const links = <>
        {icons.map(iconConfig => <link rel="icon" type={iconConfig.type} sizes={iconConfig.sizes} href={resolveHref(path.basename(iconConfig.asset), context.baseURL)} />)}
        <link rel="stylesheet" href={resolveHref(CSS_FILE_NAME, context.baseURL)} />
    </>;

    const scripts = <>
        <script src={resolveHref(SCRIPT_FILE_NAME, context.baseURL)}></script>
    </>;

    const navigation = renderNavigation(context.title, context);

    site.write(CSS_FILE_NAME, fs.readFileSync(path.format({ ...path.parse(moduleFilePath), base: "", ext: ".css" })));
    site.write(FONT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, fontAssetFilePath)));
    site.write(SCRIPT_FILE_NAME, fs.readFileSync(path.resolve(modulePath, scriptAssetFilePath)));

    for (const iconConfig of icons) {
        site.write(path.basename(iconConfig.asset), project.package.read(iconConfig.asset));
    }

    for (const assetPath in assets) {
        site.write(assets[assetPath], project.package.read(assetPath));
    }

    site.write(INDEX_FILE_NAME, Buffer.from("<!DOCTYPE html>\n" + renderHTML(renderIndex(context, links, scripts, navigation))));
    site.write(ERROR_FILE_NAME, Buffer.from("<!DOCTYPE html>\n" + renderHTML(render404(context, links, scripts, navigation))));

    for (const iri in context.outputs) {
        site.write(context.outputs[iri] + (context.appendHtmlSuffix ? "" : ".html"), Buffer.from("<!DOCTYPE html>\n" + renderHTML(renderPage(iri, context, links, scripts, navigation))));
    }
}
