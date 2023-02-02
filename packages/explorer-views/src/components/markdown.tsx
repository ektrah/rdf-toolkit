import { Ix } from "@rdf-toolkit/iterable";
import { IRI } from "@rdf-toolkit/rdf/terms";
import { IRIReference } from "@rdf-toolkit/text";
import * as commonmark from "commonmark";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import { renderLines } from "./listing.js";
import "./markdown.css";
import renderRdfTerm from "./rdf-term.js";

export default function render(text: string, context: RenderContext, baseIRI: IRI | null): HtmlContent {
    const baseIRIReference = baseIRI ? IRIReference.parse(baseIRI.value) : null;

    function renderLiteral(node: commonmark.Node): HtmlContent {
        return (node.literal || "").replace(/\p{Zs}|\p{Cc}/ug, " ");
    }

    function* renderChildren(node: commonmark.Node): Generator<HtmlContent> {
        for (let child = node.firstChild; child; child = child.next) {
            yield renderNode(child);
        }
    }

    function renderCodeListing(node: commonmark.Node): HtmlContent {
        return renderLines((node.literal || "")
            .split(/\n|\r\n?|\p{Zl}|\p{Zp}/ug)
            .map(line => line.indexOf("\t") >= 0
                ? Ix.from(line.split(/\t/ug))
                    .map<HtmlContent>(segment => segment.replace(/\p{Zs}|\p{Cc}/ug, " "))
                    .intersperse(<span class="listing-tab"> </span>)
                : line.replace(/\p{Zs}|\p{Cc}/ug, " ")));
    }

    function renderLink(node: commonmark.Node): HtmlContent {
        if (node.destination) {
            let destination = IRIReference.parse(node.destination);
            if (destination) {
                if (baseIRIReference) {
                    destination = IRIReference.resolve(destination, baseIRIReference);
                }
                if (destination.scheme) {
                    return renderRdfTerm(IRI.create(destination), context, { linkContents: node.firstChild ? renderChildren(node) : undefined });
                }
            }
        }
        return "\uFFFC";
    }

    function renderImage(node: commonmark.Node): HtmlContent {
        return "\uFFFC";
    }

    function renderNode(node: commonmark.Node): HtmlContent {
        switch (node.type) {
            case "text":
                return renderLiteral(node);

            case "softbreak":
                return " ";

            case "linebreak":
                return <br />;

            case "emph":
                return <em>{renderChildren(node)}</em>;

            case "strong":
                return <strong>{renderChildren(node)}</strong>;

            case "html_inline":
                return <span class="markdown-html">{renderLiteral(node)}</span>;

            case "link":
                return renderLink(node);

            case "image":
                return renderImage(node);

            case "code":
                return <code>{renderLiteral(node)}</code>;

            case "document":
                return <div class="markdown">{renderChildren(node)}</div>;

            case "paragraph":
                return <p>{renderChildren(node)}</p>;

            case "block_quote":
                return <blockquote>{renderChildren(node)}</blockquote>;

            case "item":
                return <li>{renderChildren(node)}</li>;

            case "list":
                switch (node.listType) {
                    case "bullet": return <ul>{renderChildren(node)}</ul>;
                    case "ordered": return <ol>{renderChildren(node)}</ol>;
                }

            case "heading":
                switch (node.level) {
                    case 1: return <h3>{renderChildren(node)}</h3>;
                    case 2: return <h4>{renderChildren(node)}</h4>;
                    case 3: return <h5>{renderChildren(node)}</h5>;
                    case 4: return <h6>{renderChildren(node)}</h6>;
                    default: return <p>{renderChildren(node)}</p>;
                }

            case "code_block":
                return renderCodeListing(node);

            case "html_block":
                return <p class="markdown-html">{renderLiteral(node)}</p>;

            case "thematic_break":
                return <hr />;

            case "custom_inline":
            case "custom_block":
                return null;
        }
    }

    return renderNode(new commonmark.Parser({ smart: true }).parse(text));
}
