import { Ix } from "@rdf-toolkit/iterable";
import { IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { Class, ClassProperty, Schema } from "@rdf-toolkit/schema";
import renderCardinality from "../components/cardinality.js";
import { renderPreformatted } from "../components/listing.js";
import renderMarkdown from "../components/markdown.js";
import renderRdfTerm, { RenderOptions } from "../components/rdf-term.js";
import renderTabView from "../components/tabview.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./schema.css";

function getSuperClasses(class_: Class, schema: Schema): Ix<IRIOrBlankNode> {
    const superClasses: Set<IRIOrBlankNode> = new Set<IRIOrBlankNode>().add(class_.id);
    let done;
    do {
        done = true;
        for (const superClass of superClasses) {
            const superClassSchema = schema.classes.get(superClass);
            if (superClassSchema) {
                for (const superSuperClass of superClassSchema.subClassOf) {
                    if (!superClasses.has(superSuperClass)) {
                        superClasses.add(superSuperClass);
                        done = false;
                    }
                }
            }
        }
    }
    while (!done);
    return Ix.from(superClasses);
}

function renderProperty(class_: Class, prop: ClassProperty, propertyClass: Class, context: RenderContext): HtmlContent {
    return <tr>
        <td>
            <p>
                {prop.minCount !== 1n || prop.maxCount !== 1n ? <>{renderCardinality(prop.minCount, prop.maxCount)} </> : null}
                {renderRdfTerm(prop.id, context, { rawBlankNodes: true })}
            </p>
            {propertyClass.id !== class_.id ? <p class="schema-label">(inherited from {renderRdfTerm(propertyClass.id, context, { rawBlankNodes: true })})</p> : null}
        </td>
        <td>
            <ul>
                {Ix.from(prop.value).map(q => <li>{renderRdfTerm(q, context, { rawBlankNodes: true, rawLiterals: true })}</li>)}
            </ul>
        </td>
        <td>
            {renderMarkdown(prop.description || "", context, prop.id)}
        </td>
    </tr>;
}

function renderProperties(class_: Class, context: RenderContext): HtmlContent {
    return <section>
        <h2>Properties</h2>
        <table class="properties">
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Value</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {
                    getSuperClasses(class_, context.schema)
                        .map(x => context.schema.classes.get(x))
                        .concatMap(c => c ? Ix.from(c.properties).map(p => renderProperty(class_, p, c, context)) : Ix.empty)
                }
            </tbody>
        </table>
    </section>;
}

function renderClassCode(class_: Class, context: RenderContext): HtmlContent {
    const options: RenderOptions = { rawBlankNodes: true };
    return renderPreformatted(<>
        <span class="schema-keyword">class</span>
        {" "}
        {renderRdfTerm(class_.id, context, options)}
        {
            class_.subClassOf.length
                ? <>
                    {" "}
                    <span class="schema-keyword">extends</span>
                    {" "}
                    {
                        Ix.from(class_.subClassOf)
                            .map(c => <><br />    {renderRdfTerm(c, context, options)}</>)
                            .intersperse(<>,</>)
                    }
                </>
                : null
        }
        {
            class_.properties.length
                ? <>
                    <br />
                    {"{"}
                    {
                        Ix.from(class_.properties).map(p => <>
                            <br />
                            {"    "}
                            {p.minCount !== 1n || p.maxCount !== 1n ? <>{renderCardinality(p.minCount, p.maxCount)} </> : ""}
                            {renderRdfTerm(p.id, context, options)}
                            {" "}
                            {
                                p.value.length === 0
                                    ? "()"
                                    : p.value.length === 1
                                        ? <>
                                            {renderRdfTerm(p.value[0], context, options)}
                                            {";"}
                                        </>
                                        : <span class={p.value.length > 3 ? "schema-list" : null}>
                                            {
                                                Ix.from(p.value).map((v, i) => <span>
                                                    {i === 0 ? "( " : "| "}
                                                    {renderRdfTerm(v, context, options)}
                                                    {" "}
                                                </span>)
                                            }
                                            <span>{")"}</span>
                                        </span>
                            }
                        </>)
                    }
                    <br />
                    {"}"}
                </>
                : " ."
        }
    </>);
}

function renderDefinition(class_: Class, context: RenderContext): HtmlContent {
    return <section>
        <h2>Definition</h2>
        {
            class_.description ? renderMarkdown(class_.description, context, IRI.is(class_.id) ? class_.id : null) : null
        }
        {
            renderTabView("definition", [
                {
                    id: "definition-schema",
                    label: "Schema",
                    content: renderClassCode(class_, context)
                },
            ])
        }
    </section>;
}

function renderInstances(class_: Class, context: RenderContext): HtmlContent {
    return context.graph.getDirectInstances(class_.id)
        .sort((a, b) => a.compareTo(b))
        .map(instance => <li>{renderRdfTerm(instance, context, { rawBlankNodes: true })}</li>)
        .wrap(instances =>
            <section>
                <h2>Instances</h2>
                <ul class="schema-columns">{instances}</ul>
            </section>, null);
}

function renderClass(class_: Class, context: RenderContext): HtmlContent {
    return <>
        {renderDefinition(class_, context)}
        {renderInstances(class_, context)}
        {renderProperties(class_, context)}
    </>;
}

export default function render(subject: IRIOrBlankNode, context: RenderContext): HtmlContent {
    const class_ = context.schema.classes.get(subject);
    return class_ ? renderClass(class_, context) : <></>;
}
