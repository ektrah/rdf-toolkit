import { IRI } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { DocumentUri, TextDocument } from "@rdf-toolkit/text";
import { SymbolTable, SyntaxKind, SyntaxTree } from "@rdf-toolkit/turtle";
import * as fs from "node:fs";
import { Ontology } from "./ontology.js";
import { Package } from "./package.js";
import { Project } from "./project.js";

interface FileFormat {
    readonly contentType: string;
    readonly fileExtension: string;
    readonly languageId: string;
}

export class TextFile {
    private _buffer?: Buffer;
    private _document?: TextDocument;
    private _format?: FileFormat;
    private _ontology?: Ontology;
    private _symbolTable?: SymbolTable;
    private _syntaxTree?: SyntaxTree;
    private _terms?: ReadonlyArray<IRI>;
    private _text?: string;
    private _triples?: ReadonlyArray<ParsedTriple>;

    constructor(readonly documentURI: DocumentUri, readonly filePath: string, readonly containingPackage: Package) {
    }

    get buffer(): Buffer {
        return this._buffer ??= fs.readFileSync(this.filePath, { flag: "r" });
    }

    get containingProject(): Project {
        return this.containingPackage.containingProject;
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

    get languageId(): string {
        return (this._format ??= getFormat(this.filePath)).languageId;
    }

    get ontology(): Ontology | undefined {
        return this._ontology ??= Ontology.from(this.syntaxTree, this.symbolTable);
    }

    get symbolTable(): SymbolTable {
        return this._symbolTable ??= SymbolTable.from(this.syntaxTree, this.containingProject.diagnostics);
    }

    get syntaxTree(): SyntaxTree {
        return this._syntaxTree ??= SyntaxTree.parse(this.document, this.containingProject.diagnostics);
    }

    get terms(): ReadonlyArray<IRI> {
        return this._terms ??= getTerms(this.syntaxTree, this.symbolTable);
    }

    get text(): string {
        return this._text ??= this.buffer.toString("utf-8");
    }

    get triples(): ReadonlyArray<ParsedTriple> {
        return this._triples ??= SyntaxTree.compileTriples(this.syntaxTree, this.containingProject.diagnostics);
    }
}

function getFormat(filePath: string): FileFormat {
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

function getTerms(syntaxTree: SyntaxTree, symbolTable: SymbolTable): Array<IRI> {
    const terms = new Set<IRI>();

    for (const statement of syntaxTree.root.statements) {
        if (statement.kind === SyntaxKind.SubjectPredicateObjectList) {
            const subject = symbolTable.get(statement.subject);
            if (subject) {
                terms.add(subject);
            }
        }
    }

    return Array.from(terms);
}
