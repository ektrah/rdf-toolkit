import { BlankNode } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { DiagnosticBag, Position, Range, TextDocument } from "@rdf-toolkit/text";
import { TurtleCompiler } from "./compiler.js";
import { tokenizeLiterateTurtle } from "./literate.js";
import { TurtleParser } from "./parser.js";
import { TurtleScanner } from "./scanner.js";
import { DocumentSyntax, SyntaxNode, SyntaxToken } from "./syntax.js";

export interface ParserState {
    readonly baseIRI: string;
    readonly bnodeLabels: Record<string, BlankNode>,
    readonly namespaces: Record<string, string>,
    readonly triples: Array<ParsedTriple>,
}

export interface SyntaxTree {
    getRange(node: SyntaxToken | SyntaxNode): Range;
    getPosition(node: SyntaxToken | SyntaxNode): Position;
    readonly document: TextDocument;
    readonly root: DocumentSyntax,
}

export namespace SyntaxTree {

    export function create(uri: string, languageId: string, version: number, root: DocumentSyntax): SyntaxTree {
        return new FullSyntaxTree(TextDocument.create(uri, languageId, version, SyntaxNode.toString(root)), root);
    }

    export function tokenize(document: TextDocument, diagnostics: DiagnosticBag): IterableIterator<SyntaxToken> {
        switch (document.languageId) {
            case "turtle":
                return new TurtleScanner(document, 0, diagnostics);
            case "markdown":
                return tokenizeLiterateTurtle(document, diagnostics);
            default:
                throw new Error();
        }
    }

    export function parse(document: TextDocument, diagnostics: DiagnosticBag): SyntaxTree {
        switch (document.languageId) {
            case "turtle": {
                const scanner = new TurtleScanner(document, 0, diagnostics);
                const parser = new TurtleParser(scanner, document, diagnostics);
                return new FullSyntaxTree(document, parser.parse());
            }
            case "markdown": {
                const scanner = tokenizeLiterateTurtle(document, diagnostics);
                const parser = new TurtleParser(scanner, document, diagnostics);
                return new FullSyntaxTree(document, parser.parse());
            }
            default:
                throw new Error("Unsupported file format");
        }
    }

    export function compileTriples(syntaxTree: SyntaxTree, diagnostics: DiagnosticBag, options?: { returnParserState?: false }): ParsedTriple[];
    export function compileTriples(syntaxTree: SyntaxTree, diagnostics: DiagnosticBag, options: { returnParserState: true }): ParserState;
    export function compileTriples(syntaxTree: SyntaxTree, diagnostics: DiagnosticBag, options: { returnParserState?: boolean } = {}): ParsedTriple[] | ParserState {
        if (options?.returnParserState) {
            return new TurtleCompiler(syntaxTree, diagnostics).compile();
        }
        else {
            return new TurtleCompiler(syntaxTree, diagnostics).compile().triples;
        }
    }
}

class FullSyntaxTree implements SyntaxTree {

    constructor(readonly document: TextDocument, readonly root: DocumentSyntax) {
    }

    getRange(node: SyntaxToken | SyntaxNode): Range {
        const firstToken = SyntaxToken.is(node) ? node : SyntaxNode.getFirstToken(node);
        const lastToken = SyntaxToken.is(node) ? node : SyntaxNode.getLastToken(node);
        return Range.create(
            this.document.positionAt(firstToken.offset),
            this.document.positionAt(lastToken.offset + lastToken.text.length));
    }

    getPosition(node: SyntaxToken | SyntaxNode): Position {
        const token = SyntaxToken.is(node) ? node : SyntaxNode.getFirstToken(node);
        return this.document.positionAt(token.offset);
    }
}
