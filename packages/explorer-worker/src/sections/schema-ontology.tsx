import { Ix } from "@rdf-toolkit/iterable";
import { IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { Owl } from "@rdf-toolkit/rdf/vocab";
import { Ontology } from "@rdf-toolkit/schema";
import renderMarkdown from "../components/markdown.js";
import renderRdfTerm from "../components/rdf-term.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./schema.css";

function renderOntology(ontology: Ontology, context: RenderContext): HtmlContent {
    return <>
        {
            ontology.description ?
                <section>
                    <h2>Overview</h2>
                    {renderMarkdown(ontology.description, context, IRI.is(ontology.id) ? ontology.id : null)}
                </section> : null
        }
        {
            context.graph.objects(ontology.id, Owl.imports)
                .sort((a, b) => a.compareTo(b))
                .wrap(imports =>
                    <section>
                        <h2>Imports</h2>
                        <ul>
                            {imports.map(import_ => <li>{renderRdfTerm(import_, context, { expandIRIs: true, rawIRIs: true, rawBlankNodes: true, rawLiterals: true })}</li>)}
                        </ul>
                    </section>, null)
        }
        {
            Ix.from(ontology.definitions)
                .ofType(IRI.is)
                .filter(term => context.graph.isClass(term))
                .wrap(classes =>
                    <section>
                        <h2>Classes</h2>
                        <ul class="schema-columns">
                            {classes.map(class_ => <li>{renderRdfTerm(class_, context, { hideBlankNodeDetails: true })}</li>)}
                        </ul>
                    </section>, null)
        }
        {
            Ix.from(ontology.definitions)
                .ofType(IRI.is)
                .filter(term => context.graph.isProperty(term))
                .wrap(properties =>
                    <section>
                        <h2>Properties</h2>
                        <ul class="schema-columns">
                            {properties.map(property => <li>{renderRdfTerm(property, context, { hideBlankNodeDetails: true })}</li>)}
                        </ul>
                    </section>, null)
        }
    </>;
}

export default function render(subject: IRIOrBlankNode, context: RenderContext): HtmlContent {
    const ontology = context.schema.ontologies.get(subject);
    return ontology ? renderOntology(ontology, context) : <></>;
}
