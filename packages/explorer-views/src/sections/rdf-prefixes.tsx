import { Ix } from "@rdf-toolkit/iterable";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./rdf-prefixes.css";

export default function render(context: RenderContext): HtmlContent {
    return Ix.from(context.getPrefixes())
        .sort(([, a], [, b]) => a.localeCompare(b))
        .filter(([, prefixLabel]) => prefixLabel !== "_")
        .map(([namespaceIRI, prefixLabel]) =>
            <tr>
                <td>
                    <span class="rdf-prefixes-prefixlabel">{prefixLabel}</span>
                </td>
                <td>{namespaceIRI}</td>
            </tr>)
        .wrap(content =>
            <details>
                <summary>RDF prefixes</summary>
                <h2>RDF Prefixes</h2>
                <table class="rdf-prefixes">
                    <tr>
                        <th>Prefix</th>
                        <th>Namespace IRI</th>
                    </tr>
                    {content}
                </table>
            </details>, <></>);
}
