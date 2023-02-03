import { Ix } from "@rdf-toolkit/iterable";
import { BlankNode, IRIOrBlankNode, Literal, Term } from "@rdf-toolkit/rdf/terms";
import { Triple } from "@rdf-toolkit/rdf/triples";
import { Owl, Rdf, Xsd } from "@rdf-toolkit/rdf/vocab";
import { IRIReference } from "@rdf-toolkit/text";
import { SyntaxToken, TokenKind } from "@rdf-toolkit/turtle";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import renderRdfTriple from "./rdf-triple.js";
import "./rdf.css";

export type RenderOptions = {
    anyURIAsLink?: boolean,
    expandIRIs?: boolean,
    hiddenNodes?: BlankNode[],
    hideBlankNodeDetails?: boolean,
    hideDeprecationHint?: boolean,
    hideError?: boolean,
    linkContents?: HtmlContent,
    rawBlankNodes?: boolean,
    rawIRIs?: boolean,
    rawLiterals?: boolean,
}

function renderCollection(list: IRIOrBlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    const items = context.graph.list(list);
    if (!items) {
        return null;
    }
    const content: HtmlContent[] = [];
    let first = true;
    for (const item of items) {
        content.push(<span>{first ? "( " : ", "}{render(item, context, options)}</span>);
        first = false;
    }
    content.push(<span>{first ? "()" : " )"}</span>);
    return <span class="rdf-collection">{content}</span>;
}

function renderCompactedBlankNode(node: BlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    const content: HtmlContent[] = [];
    let first = true;
    let omitted = false;

    for (const triple of context.graph.triples(node)) {
        switch (triple.predicate) {
            case Rdf.first:
            case Rdf.rest:
                return <span class="rdf-collection">( &#x2026; )</span>;
            case Rdf.type:
            case Owl.intersectionOf:
            case Owl.unionOf:
            case Owl.oneOf:
            case Owl.onProperty:
                if (Triple.isInferred(triple)) {
                    break;
                }
                content.push(<span>
                    {first ? "[ " : "; "}
                    {render(triple.predicate, context, options)}
                    {" "}
                    {render(triple.object, context, options)}
                </span>);
                first = false;
                continue;
        }
        omitted = true;
    }

    if (omitted) {
        const href = context.rewriteHref ? context.rewriteHref(node.value) : node.value;
        const data = context.rewriteHrefAsData ? context.rewriteHrefAsData(node.value) : undefined;

        const css = [
            "rdf-iri-blanknode",
            "rdf-iri",
            !options.hideError && context.graph.triples(node).every(Triple.isInferred) ? "rdf-error" : null,
            !options.hideDeprecationHint && context.graph.isDeprecated(node) ? "rdf-deprecated" : null,
        ];

        content.push(<span>{first ? "[ " : "; "}<a class={css} href={href} data-href={data}>&#x2026;</a></span>);
        first = false;
    }

    content.push(<span>{first ? "[]" : " ]"}</span>);
    return <span class="rdf-blanknode"><span>{content}</span></span>;
}

function renderExpandedBlankNode(node: BlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    const content: HtmlContent[] = [];
    let first = true;

    for (const triple of context.graph.triples(node)) {
        switch (triple.predicate) {
            case Rdf.first:
            case Rdf.rest:
                const collection: HtmlContent = renderCollection(node, context, options);
                if (collection) {
                    return collection;
                }
                break;
        }
        content.push(<span>{first ? "[ " : "; "}{renderRdfTriple(triple, context, options)}</span>);
        first = false;
    }

    content.push(<span>{first ? "[]" : " ]"}</span>);
    return <span class="rdf-blanknode">{content}</span>;
}

function renderBlankNode(node: BlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    if (options.hiddenNodes) {
        const x = options.hiddenNodes.indexOf(node);
        if (x >= 0) {
            return <span class="rdf-blanknode">&#x21BA;{x < 5 ? ["", "\u2032", "\u2033", "\u2034", "\u2057"][x] : "\u207A"}</span>;
        }
        else if (options.hiddenNodes.length > 8) {
            return <span class="rdf-blanknode">&#x2026;</span>;
        }
        else if (options.hiddenNodes.length > 4) {
            options = Object.assign<RenderOptions, RenderOptions, RenderOptions>({}, options, { hideBlankNodeDetails: true });
        }
    }

    options = Object.assign<RenderOptions, RenderOptions, RenderOptions>({}, options, { hiddenNodes: [node, ...options.hiddenNodes || []] });

    if (options.rawBlankNodes) {
        return renderIRI(node, context, options);
    }
    else if (options.hideBlankNodeDetails) {
        return renderCompactedBlankNode(node, context, options);
    }
    else {
        return renderExpandedBlankNode(node, context, options);
    }
}

function renderShortenedIRI(iri: IRIOrBlankNode, options: RenderOptions): string {
    if (!options.rawIRIs) {
        const h: RegExpMatchArray | null = iri.value.match(/^(https?:\/\/.{3,7})(.*?)(.[^/?#]{1,9}[/?#][^/?#]*)$/);
        if (h && h[2]) {
            return h[1] + "\u2026" + h[3];
        }
        const u: RegExpMatchArray | null = iri.value.match(/^(urn:.{3,7})(.*?)(.{3,9})$/);
        if (u && u[2]) {
            return u[1] + "\u2026" + u[3];
        }
    }
    return iri.value;
}

function renderExpandedIRI(iri: IRIOrBlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    const href = context.rewriteHref ? context.rewriteHref(iri.value) : iri.value;
    const data = context.rewriteHrefAsData ? context.rewriteHrefAsData(iri.value) : undefined;

    const css = [
        "rdf-iri",
        !options.hideError && context.graph.triples(iri).every(Triple.isInferred) ? "rdf-error" : null,
        !options.hideDeprecationHint && context.graph.isDeprecated(iri) ? "rdf-deprecated" : null,
        options.linkContents ? "rdf-custom" : null,
    ];

    return <a class={css} href={href} data-href={data}>
        {options.linkContents || <>
            <span class="rdf-iri-openangle">&lt;</span>
            <span class="rdf-iri-ref">{renderShortenedIRI(iri, options)}</span>
            <span class="rdf-iri-closeangle">&gt;</span>
        </>}
    </a>;
}

function renderCompactedIRI(iri: IRIOrBlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    if (iri === Rdf.type) {
        const href = context.rewriteHref ? context.rewriteHref(iri.value) : iri.value;
        const data = context.rewriteHrefAsData ? context.rewriteHrefAsData(iri.value) : undefined;

        const css = [
            "rdf-iri",
            !options.hideError && context.graph.triples(iri).every(Triple.isInferred) ? "rdf-error" : null,
            !options.hideDeprecationHint && context.graph.isDeprecated(iri) ? "rdf-deprecated" : null,
            options.linkContents ? "rdf-custom" : null,
        ];

        return <a class={css} href={href} data-href={data}>
            {options.linkContents || SyntaxToken.create(TokenKind.AKeyword, undefined).text}
        </a>;
    }

    const prefixedName = context.lookupPrefixedName(iri.value);
    if (prefixedName) {
        const href = context.rewriteHref ? context.rewriteHref(iri.value) : iri.value;
        const data = context.rewriteHrefAsData ? context.rewriteHrefAsData(iri.value) : undefined;

        const css = [
            prefixedName.localName.length ? "rdf-pname-ln" : "rdf-pname-ns",
            "rdf-iri",
            !options.hideError && context.graph.triples(iri).every(Triple.isInferred) ? "rdf-error" : null,
            !options.hideDeprecationHint && context.graph.isDeprecated(iri) ? "rdf-deprecated" : null,
            options.linkContents ? "rdf-custom" : null,
        ];

        return <a class={css} href={href} data-href={data}>
            {options.linkContents || <>
                {prefixedName.prefixLabel.length ? <span class="rdf-iri-prefixlabel">{prefixedName.prefixLabel}</span> : null}
                <span class="rdf-iri-colon">:</span>
                {prefixedName.localName.length ? <span class="rdf-iri-localname">{Ix.from<HtmlContent>(prefixedName.localName.split(/(?<=[^A-Z])(?=[A-Z])/)).intersperse(<wbr />)}</span> : null}
            </>}
        </a>;
    }

    return renderExpandedIRI(iri, context, options);
}

function renderIRI(iri: IRIOrBlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    if (options.expandIRIs) {
        return renderExpandedIRI(iri, context, options);
    }
    else {
        return renderCompactedIRI(iri, context, options);
    }
}

function renderIRIOrBlankNode(iriOrBlankNode: IRIOrBlankNode, context: RenderContext, options: RenderOptions): HtmlContent {
    if (BlankNode.is(iriOrBlankNode)) {
        return renderBlankNode(iriOrBlankNode, context, options);
    }
    else {
        return renderIRI(iriOrBlankNode, context, options);
    }
}

function renderLiteral(literal: Literal, context: RenderContext, options: RenderOptions): HtmlContent {
    if (literal.datatype === Rdf.langString) {
        return <span class="rdf-langstring">
            <span class="rdf-langstring-text">{SyntaxToken.create(TokenKind.STRING_LITERAL_QUOTE, literal.value).text}</span>
            <span class="rdf-langstring-tag">{SyntaxToken.create(TokenKind.LANGTAG, literal.language).text}</span>
        </span>;
    }

    if (literal.datatype === Xsd.anyURI && options.anyURIAsLink) {
        const iriref = IRIReference.parse(literal.value);
        if (iriref && iriref.scheme) {
            return <a class="rdf-anyURI" href={literal.value} rel="external" target="_blank">{options.linkContents || literal.value}</a>;
        }
    }

    if (!options.rawLiterals) {
        switch (literal.datatype) {
            case Xsd.boolean:
                if (Literal.hasBooleanValue(literal)) {
                    return <span class="rdf-boolean">{SyntaxToken.create(literal.valueAsBoolean ? TokenKind.TrueKeyword : TokenKind.FalseKeyword, undefined).text}</span>;
                }
                break;
            case Xsd.integer:
                if (Literal.hasBigIntValue(literal)) {
                    return <span class="rdf-number">{SyntaxToken.create(TokenKind.INTEGER, literal.valueAsBigInt).text}</span>;
                }
                break;
            case Xsd.decimal:
                if (Literal.hasNumberValue(literal)) {
                    return <span class="rdf-number">{SyntaxToken.create(TokenKind.DECIMAL, literal.valueAsNumber).text}</span>;
                }
                break;
            case Xsd.double:
                if (Literal.hasNumberValue(literal)) {
                    return <span class="rdf-number">{SyntaxToken.create(TokenKind.DOUBLE, literal.valueAsNumber).text}</span>;
                }
                break;
            case Xsd.string:
                if (Literal.hasStringValue(literal)) {
                    return <span class="rdf-string">{SyntaxToken.create(TokenKind.STRING_LITERAL_QUOTE, literal.valueAsString).text}</span>;
                }
                break;
        }
    }

    return <span class="rdf-literal">
        <span class="rdf-literal-text">{SyntaxToken.create(TokenKind.STRING_LITERAL_QUOTE, literal.value).text}</span>
        <wbr />
        <span class="rdf-literal-caretcaret">^^</span>
        <span class="rdf-literal-type">{renderIRI(literal.datatype, context, {})}</span>
    </span>;
}

export default function render(term: Term, context: RenderContext, options: RenderOptions = {}): HtmlContent {
    if (Literal.is(term)) {
        return renderLiteral(term, context, options);
    }
    else {
        return renderIRIOrBlankNode(term, context, options);
    }
}
