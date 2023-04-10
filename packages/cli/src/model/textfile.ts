import { IRI, Literal } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { Owl, Xsd } from "@rdf-toolkit/rdf/vocab";
import { DocumentUri, TextDocument } from "@rdf-toolkit/text";
import { SyntaxTree } from "@rdf-toolkit/turtle";
import * as fs from "node:fs";
import { Project } from "./project.js";

interface DataFormat {
    readonly contentType: string;
    readonly fileExtension: string;
    readonly languageId: string;
}

interface OWLOntology {
    readonly imports: ReadonlySet<string>;
    readonly ontologyIRI: string | undefined;
}

export class TextFile {
    private _buffer?: Buffer;
    private _document?: TextDocument;
    private _format?: DataFormat;
    private _owl?: OWLOntology;
    private _syntaxTree?: SyntaxTree;
    private _text?: string;
    private _triples?: ReadonlyArray<ParsedTriple>;

    constructor(readonly documentURI: DocumentUri, readonly filePath: string, readonly containingProject: Project) {
    }

    get buffer(): Buffer {
        return this._buffer ??= fs.readFileSync(this.filePath, { flag: "r" });
    }

    get contentType(): string {
        return (this._format ??= getFormat(this.filePath)).contentType;
    }

    get document(): TextDocument {
        return this._document ??= TextDocument.create(this.documentURI, this.languageId, 0, this.text);
    }

    get fileExtension(): string {
        return (this._format ??= getFormat(this.filePath)).fileExtension;
    }

    get imports(): ReadonlySet<string> {
        return (this._owl ??= getOWLOntology(this.triples)).imports;
    }

    get languageId(): string {
        return (this._format ??= getFormat(this.filePath)).languageId;
    }

    get ontologyIRI(): string | undefined {
        return (this._owl ??= getOWLOntology(this.triples)).ontologyIRI;
    }

    get syntaxTree(): SyntaxTree {
        return this._syntaxTree ??= SyntaxTree.parse(this.document, this.containingProject.diagnostics);
    }

    get text(): string {
        return this._text ??= this.buffer.toString("utf-8");
    }

    get triples(): ReadonlyArray<ParsedTriple> {
        return this._triples ??= SyntaxTree.compileTriples(this.syntaxTree, this.containingProject.diagnostics);
    }
}

function getFormat(filePath: string): DataFormat {
    if (/[.](?:ttl)$/i.test(filePath)) {
        return { contentType: "text/turtle", fileExtension: "ttl", languageId: "turtle" };
    }
    else if (/[.](?:md|mkdn?|mdwn|mdown|markdown)$/i.test(filePath)) {
        return { contentType: "text/markdown", fileExtension: "md", languageId: "markdown" };
    }
    else if (/[.](?:owl|rdf|xml)$/i.test(filePath)) {
        return { contentType: "application/xml", fileExtension: "xml", languageId: "xml" };
    }
    else {
        return { contentType: "text/plain", fileExtension: "txt", languageId: "plaintext" };
    }
}

function getOWLOntology(triples: Iterable<ParsedTriple>): Readonly<OWLOntology> {
    const imports = new Set<string>();
    let ontologyIRI: string | undefined;

    for (const triple of triples) {
        switch (triple.predicate) {
            case Owl.imports:
                if (IRI.is(triple.subject)) {
                    ontologyIRI = triple.subject.value;
                }
                if (IRI.is(triple.object) || (Literal.is(triple.object) && (triple.object.datatype === Xsd.string || triple.object.datatype === Xsd.anyURI))) {
                    imports.add(triple.object.value);
                }
                break;
        }
    }

    return {
        ontologyIRI,
        imports,
    };
}
