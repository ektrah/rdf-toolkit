import { Ix } from "@rdf-toolkit/iterable";
import { IRI } from "@rdf-toolkit/rdf/terms";
import { Property } from "@rdf-toolkit/schema";
import { renderPreformatted } from "../components/listing.js";
import renderMarkdown from "../components/markdown.js";
import renderRdfTerm, { RenderOptions } from "../components/rdf-term.js";
import renderTabView from "../components/tabview.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./schema.css";

function renderPropertyCode(property: Property, context: RenderContext): HtmlContent {
    const options: RenderOptions = { rawBlankNodes: true };
    return renderPreformatted(<>
        <span class="schema-keyword">property</span>
        {" "}
        {renderRdfTerm(property.id, context, options)}
        {
            property.subPropertyOf.length
                ? <>
                    {" "}
                    <span class="schema-keyword">extends</span>
                    {" "}
                    {
                        Ix.from(property.subPropertyOf)
                            .map(c => <><br />    {renderRdfTerm(c, context, options)}</>)
                            .intersperse(<>,</>)
                    }
                </>
                : null
        }
        {" ."}
    </>);
}

function renderProperty(property: Property, context: RenderContext): HtmlContent {
    return <section>
        <h2>Definition</h2>
        {
            property.description ? renderMarkdown(property.description, context, property.id) : null
        }
        {
            renderTabView("property-definition", [
                {
                    id: "property-definition-schema",
                    label: "Schema",
                    content: renderPropertyCode(property, context)
                },
            ])
        }
    </section>;
}

export default function render(subject: IRI, context: RenderContext): HtmlContent {
    const property = context.schema.properties.get(subject);
    return property ? renderProperty(property, context) : <></>;
}
