import { BlankNode } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { DiagnosticBag, Position, Range, TextDocument } from "@rdf-toolkit/text";
import { TurtleCompiler } from "./compiler.js";
import { TurtleParser } from "./parser.js";
import { TurtleScanner } from "./scanner.js";
import { DocumentSyntax, SyntaxNode, SyntaxToken } from "./syntax.js";

export * from "./syntax-visitor.js";
export * from "./syntax.js";

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

    export function create(documentURI: string, documentVersion: number, root: DocumentSyntax): SyntaxTree {
        let content = "";
        for (const token of SyntaxNode.iterateTokens(root)) {
            for (const trivia of token.leadingTrivia) {
                content += trivia.text;
            }
            content += token.text;
            for (const trivia of token.trailingTrivia) {
                content += trivia.text;
            }
        }
        return new FullSyntaxTree(TextDocument.create(documentURI, "turtle", documentVersion, content), root);
    }

    export function tokenize(document: TextDocument, diagnostics: DiagnosticBag): IterableIterator<SyntaxToken> {
        switch (document.languageId) {
            case "turtle":
                return new TurtleScanner(document, diagnostics);
            default:
                throw new Error();
        }
    }

    export function parse(document: TextDocument, diagnostics: DiagnosticBag): SyntaxTree {
        switch (document.languageId) {
            case "turtle":
                const scanner = new TurtleScanner(document, diagnostics);
                const parser = new TurtleParser(scanner, document, diagnostics);
                return new FullSyntaxTree(document, parser.parse());
            default:
                throw new Error();
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
        const firstToken = SyntaxToken.is(node) ? node : SyntaxNode.firstToken(node);
        const lastToken = SyntaxToken.is(node) ? node : SyntaxNode.lastToken(node);
        return Range.create(
            this.document.positionAt(firstToken.offset),
            this.document.positionAt(lastToken.offset + lastToken.text.length));
    }

    getPosition(node: SyntaxToken | SyntaxNode): Position {
        const token = SyntaxToken.is(node) ? node : SyntaxNode.firstToken(node);
        return this.document.positionAt(token.offset);
    }
}
