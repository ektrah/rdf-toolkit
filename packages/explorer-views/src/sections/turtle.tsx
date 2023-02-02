import { Ix } from "@rdf-toolkit/iterable";
import { IRI } from "@rdf-toolkit/rdf/terms";
import { Rdf } from "@rdf-toolkit/rdf/vocab";
import { DiagnosticBag, IRIReference, TextDocument } from "@rdf-toolkit/text";
import { SyntaxToken, SyntaxTokens, SyntaxTree, SyntaxTrivia, TokenKind, TriviaKind } from "@rdf-toolkit/turtle";
import { renderLines } from "../components/listing.js";
import renderRdfTerm from "../components/rdf-term.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./turtle.css";

function renderText(text: string): HtmlContent {
    return text.indexOf("\t") >= 0
        ? Ix.from(text.split(/\t/ug))
            .map<HtmlContent>(segment => segment.replace(/\p{Zs}|\p{Cc}/ug, " "))
            .intersperse(<span class="listing-tab"> </span>)
        : text.replace(/\p{Zs}|\p{Cc}/ug, " ");
}

class TurtleRenderer {
    private readonly iterator: Iterator<SyntaxToken>;
    private readonly lines: HtmlContent[][];
    private readonly namespaces: Record<string, string>;

    private baseIRI: IRIReference;

    constructor(document: TextDocument, private readonly context: RenderContext) {
        const baseIRI = IRIReference.parse(document.uri);
        if (!baseIRI || !baseIRI.scheme) {
            throw new Error();
        }

        this.iterator = SyntaxTree.tokenize(document, DiagnosticBag.create());

        this.namespaces = {};
        this.baseIRI = baseIRI;

        this.lines = [[]];
    }

    private scan(): SyntaxToken {
        return this.iterator.next().value;
    }

    private append(content: HtmlContent): void {
        this.lines[this.lines.length - 1].push(content);
    }

    private appendLine(): void {
        this.lines.push([]);
    }

    render(): HtmlContent[][] {
        let current = this.scan();

        for (; ;) {
            switch (current.kind) {
                case TokenKind.AtPrefixKeyword:
                case TokenKind.PrefixKeyword:
                    {
                        const keyword = current; current = this.scan();
                        if (current.kind === TokenKind.PNAME_NS) {
                            const prefixLabel = current; current = this.scan();
                            if (current.kind === TokenKind.IRIREF) {
                                const iriref = current; current = this.scan();

                                this.namespaces[prefixLabel.value.prefixLabel] = IRIReference.recompose(IRIReference.resolve(iriref.value, this.baseIRI));

                                this.renderTokenAndTrivia(keyword);
                                this.renderTokenAndTrivia(prefixLabel, true);
                                this.renderTokenAndTrivia(iriref, true);
                            }
                            else {
                                this.renderTokenAndTrivia(keyword);
                                this.renderTokenAndTrivia(prefixLabel);
                            }
                        }
                        else {
                            this.renderTokenAndTrivia(keyword);
                        }
                    }
                    break;

                case TokenKind.AtBaseKeyword:
                case TokenKind.BaseKeyword:
                    {
                        const keyword = current; current = this.scan();
                        if (current.kind === TokenKind.IRIREF) {
                            const iriref = current; current = this.scan();

                            this.baseIRI = IRIReference.resolve(iriref.value, this.baseIRI);

                            this.renderTokenAndTrivia(keyword);
                            this.renderTokenAndTrivia(iriref, true);
                        }
                        else {
                            this.renderTokenAndTrivia(keyword);
                        }
                    }
                    break;

                case TokenKind.EndOfFile:
                    this.renderTokenAndTrivia(current);
                    return this.lines;

                default:
                    const token = current; current = this.scan();
                    this.renderTokenAndTrivia(token);
                    break;
            }
        }
    }

    private renderTokenAndTrivia(token: SyntaxToken, hideError = false): void {
        for (const trivia of token.leadingTrivia) {
            this.renderTrivia(trivia);
        }
        this.renderToken(token, hideError);
        for (const trivia of token.trailingTrivia) {
            this.renderTrivia(trivia);
        }
    }

    private renderToken(token: SyntaxToken, hideError: boolean): void {
        switch (token.kind) {
            case TokenKind.AKeyword:
                this.append(renderRdfTerm(Rdf.type, this.context, { linkContents: renderText(token.text), expandIRIs: true, rawIRIs: true, hideDeprecationHint: true, hideError }))
                break;

            case TokenKind.TrueKeyword:
            case TokenKind.FalseKeyword:
            case TokenKind.AtBaseKeyword:
            case TokenKind.AtPrefixKeyword:
            case TokenKind.BaseKeyword:
            case TokenKind.PrefixKeyword:
                this.append(<span class="turtle-keyword">{renderText(token.text)}</span>);
                break;

            case TokenKind.OpenParen:
            case TokenKind.CloseParen:
            case TokenKind.Comma:
            case TokenKind.Dot:
            case TokenKind.Semicolon:
            case TokenKind.OpenBracket:
            case TokenKind.CloseBracket:
            case TokenKind.CaretCaret:
                this.append(<span class="turtle-punctuator">{renderText(token.text)}</span>);
                break;

            case TokenKind.EndOfFile:
                break;

            case TokenKind.PNAME_NS:
            case TokenKind.PNAME_LN:
                this.renderPrefixedName(token, hideError);
                break;

            case TokenKind.BLANK_NODE_LABEL:
                this.append(<span class="turtle-blanknodelabel">{renderText(token.text)}</span>);
                break;

            case TokenKind.LANGTAG:
                this.append(<span class="turtle-langtag">{renderText(token.text)}</span>);
                break;

            case TokenKind.INTEGER:
            case TokenKind.DECIMAL:
            case TokenKind.DOUBLE:
                this.append(<span class="turtle-number">{renderText(token.text)}</span>)
                break;

            case TokenKind.STRING_LITERAL_QUOTE:
            case TokenKind.STRING_LITERAL_SINGLE_QUOTE:
            case TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE:
            case TokenKind.STRING_LITERAL_LONG_QUOTE:
                this.renderStringLiteral(token);
                break;

            case TokenKind.IRIREF:
                this.renderIRIReference(token, hideError);
                break;

            default:
                this.append(<span class="turtle-error">{renderText(token.text)}</span>);
                break;
        }
    }

    private renderIRIReference(token: SyntaxTokens[TokenKind.IRIREF], hideError: boolean): void {
        const iriref = IRIReference.resolve(token.value, this.baseIRI);
        if (!iriref || !iriref.scheme) {
            this.append(<span class="turtle-error">{renderText(token.text)}</span>);
        }
        else {
            const iri = IRI.create(iriref);
            this.append(renderRdfTerm(iri, this.context, { linkContents: renderText(token.text), expandIRIs: true, rawIRIs: true, hideDeprecationHint: true, hideError }));
        }
    }

    private renderPrefixedName(token: SyntaxTokens[TokenKind.PNAME_NS] | SyntaxTokens[TokenKind.PNAME_LN], hideError: boolean): void {
        const { prefixLabel, localName } = token.value;
        const namespace: string | undefined = this.namespaces[prefixLabel];
        if (!namespace) {
            this.append(<span class="turtle-error">{renderText(token.text)}</span>);
        }
        else {
            const iriref = IRIReference.parse(namespace + (localName || ""));
            if (!iriref || !iriref.scheme) {
                this.append(<span class="turtle-error">{renderText(token.text)}</span>);
            }
            else {
                const iri = IRI.create(iriref);
                this.append(renderRdfTerm(iri, this.context, { linkContents: renderText(token.text), expandIRIs: true, rawIRIs: true, hideDeprecationHint: true, hideError }));
            }
        }
    }

    private renderStringLiteral(token: SyntaxTokens[TokenKind.STRING_LITERAL_QUOTE] | SyntaxTokens[TokenKind.STRING_LITERAL_SINGLE_QUOTE] | SyntaxTokens[TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE] | SyntaxTokens[TokenKind.STRING_LITERAL_LONG_QUOTE]): void {
        let first = true;
        for (const line of token.text.split(/\n|\r\n?|\p{Zl}|\p{Zp}/ug)) {
            if (first) {
                first = false;
            }
            else {
                this.appendLine();
            }
            this.append(<span class="turtle-string">{renderText(line)}</span>);
        }
    }

    private renderTrivia(trivia: SyntaxTrivia): void {
        switch (trivia.kind) {
            case TriviaKind.Whitespace:
                this.append(renderText(trivia.text));
                break;
            case TriviaKind.Comment:
                this.append(<span class="turtle-comment">{renderText(trivia.text)}</span>);
                break;
            case TriviaKind.EndOfLine:
                this.appendLine();
                break;
        }
    }
}

export default function render(document: TextDocument, context: RenderContext): HtmlContent {
    return <section>
        <h2>Source</h2>
        {renderLines(new TurtleRenderer(document, context).render())}
    </section>;
}
