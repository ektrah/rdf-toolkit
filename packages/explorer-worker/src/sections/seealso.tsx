import { IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { Rdfs } from "@rdf-toolkit/rdf/vocab";
import renderRdfTerm from "../components/rdf-term.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./seealso.css";

export default function render(subject: IRIOrBlankNode, context: RenderContext): HtmlContent {
    return context.graph.getSubProperties(Rdfs.seeAlso)
        .concatMap(p => context.graph.objects(subject, p))
        .distinct()
        .sort((a, b) => a.compareTo(b))
        .wrap(items => <section>
            <h2>See Also</h2>
            <ul>
                {items.map(item => <li>{renderRdfTerm(item, context, { rawIRIs: true, rawBlankNodes: true, rawLiterals: true, anyURIAsLink: true })}</li>)}
            </ul>
        </section>, <></>);
}
