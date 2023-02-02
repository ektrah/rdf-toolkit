import { IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { TextDocument } from "@rdf-toolkit/text";
import renderRdfTerm from "../components/rdf-term.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import renderFooter from "../sections/footer.js";
import renderRDF from "../sections/rdf.js";
import renderClass from "../sections/schema-class.js";
import renderOntology from "../sections/schema-ontology.js";
import renderProperty from "../sections/schema-property.js";
import renderSeeAlso from "../sections/seealso.js";
import renderTurtleDocument from "../sections/turtle.js";
import renderValidation from "../sections/validation.js";
import "./main.css";

export default function render(subject: IRIOrBlankNode, document: TextDocument | null, context: RenderContext): HtmlContent {
    return <>
        <section>
            <h1>{renderRdfTerm(subject, context, { rawBlankNodes: true, hideError: true })}</h1>
        </section>
        {renderClass(subject, context)}
        {IRI.is(subject) ? renderProperty(subject, context) : null}
        {renderOntology(subject, context)}
        {document ? renderTurtleDocument(document, context) : null}
        {renderValidation(subject, context)}
        {renderSeeAlso(subject, context)}
        <footer>
            {renderRDF(subject, context)}
            {renderFooter(context)}
        </footer>
    </>;
}
