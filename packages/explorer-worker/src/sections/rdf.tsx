import { IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import renderRdfTerm from "../components/rdf-term.js";
import renderRdfTriple from "../components/rdf-triple.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./rdf.css";

export default function render(subject: IRIOrBlankNode, context: RenderContext): HtmlContent {
    return context.graph.triples(subject)
        .map(triple =>
            <li>
                {renderRdfTriple(triple, context)}
            </li>)
        .wrap(content =>
            <details>
                <summary>RDF data</summary>
                <h2>RDF</h2>
                <p>
                    {renderRdfTerm(subject, context, { rawBlankNodes: true, rawLiterals: true })}
                </p>
                <ul class="rdf-triples">
                    {content}
                </ul>
            </details>, <></>);
}
