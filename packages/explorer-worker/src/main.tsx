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
import { RenderContext } from "@rdf-toolkit/explorer-views/context";
import renderHTML from "@rdf-toolkit/explorer-views/jsx/html";
import renderHome from "@rdf-toolkit/explorer-views/pages/home";
import renderMain from "@rdf-toolkit/explorer-views/pages/main";
import renderNavigation from "@rdf-toolkit/explorer-views/pages/navigation";
import { Ix } from "@rdf-toolkit/iterable";
import { Graph } from "@rdf-toolkit/rdf/graphs";
import { BlankNode, IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { Schema } from "@rdf-toolkit/schema";
import { DiagnosticBag, TextDocument } from "@rdf-toolkit/text";
import { SyntaxTree } from "@rdf-toolkit/turtle";
import { PrefixTable } from "./prefixes.js";

const utf8Decoder: TextDecoder = new TextDecoder();

class BackendImpl implements Backend, RenderContext {
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

    constructor(private readonly frontend: Frontend) {
        this.graph = Graph.from(this.dataset);
        this.schema = Schema.decompile(this.dataset, this.graph);
        this.prefixes = new PrefixTable(this.namespaces);
    }

    lookupPrefixedName(iri: string): { readonly prefixLabel: string; readonly localName: string; } | null {
        return this.prefixes.lookup(iri);
    }

    beforecompile(): void {
        this.frontend.showProgress("Loading\u2026");
        this.diagnostics.clear();
    }

    compile(documentURI: string, sourceText: ArrayBuffer, sourceTextHash: ArrayBuffer): void {
        this.frontend.showProgress(`Compiling <${documentURI}>\u2026`);
        const document = this.documents[documentURI] = TextDocument.create(documentURI, "turtle", 0, utf8Decoder.decode(sourceText));
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
            this.frontend.showProgress("Reasoning over graph\u2026");
            this.graph = Graph.from(this.dataset);

            this.frontend.showProgress("Generating schema\u2026");
            this.schema = Schema.decompile(this.dataset, this.graph);

            this.frontend.showProgress("Building index\u2026");
            this.prefixes = new PrefixTable(this.namespaces);
            this.frontend.replaceNavigation(renderHTML(renderNavigation(undefined, this)));

            if (this.diagnostics.errors + this.diagnostics.warnings === 0) {
                this.frontend.hideProgress();
                return;
            }
        }

        this.frontend.showDialog(renderHTML(<>
            <p>{this.diagnostics.errors} error(s), {this.diagnostics.warnings} warning(s)</p>
            <ul>{Ix.from(this.diagnostics).map(([documentURI, diagnostic]) => <li>&lt;{documentURI}&gt;:{diagnostic.range.start.line + 1}:{diagnostic.range.start.character + 1}: {diagnostic.message}</li>)}</ul>
        </>));
    }

    navigateTo(iri: string): void {
        if (iri === "") {
            this.frontend.replaceMainContent("", renderHTML(renderHome(this)));
        }
        else {
            const subject: IRIOrBlankNode = iri.startsWith("http://example.com/.well-known/genid/")
                ? BlankNode.create(iri.substr("http://example.com/.well-known/genid/".length))
                : IRI.create(iri);

            const prefixedName = this.lookupPrefixedName(subject.value);
            const title = prefixedName ? prefixedName.prefixLabel + ":" + prefixedName.localName : "<" + subject.value + ">";

            this.frontend.replaceMainContent(title, renderHTML(renderMain(subject, iri in this.documents ? this.documents[iri] : null, this)));
        }
    }
}

WorkerChannel.connect<Backend, Frontend>(self, frontend => new BackendImpl(frontend));
