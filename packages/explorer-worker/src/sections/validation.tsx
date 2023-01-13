import { Ix } from "@rdf-toolkit/iterable";
import { IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { ResultSeverity, ResultType, Schema, ValidationResult } from "@rdf-toolkit/schema";
import renderCardinality from "../components/cardinality.js";
import renderRdfTerm, { RenderOptions } from "../components/rdf-term.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./validation.css";

function renderResult(result: ValidationResult, context: RenderContext): HtmlContent {
    const options: RenderOptions = { rawBlankNodes: true, rawLiterals: true };
    switch (result.type) {
        case ResultType.PropertyDeprecated:
            return <span>{renderRdfTerm(result.property.id, context, options)} is deprecated</span>;
        case ResultType.ClassDeprecated:
            return <span>{renderRdfTerm(result.class.id, context, options)} is deprecated</span>;
        case ResultType.ExtraProperty:
            return <span>{renderRdfTerm(result.propertyID, context, options)} is extra</span>;
        case ResultType.NoValue:
            return <span>{renderRdfTerm(result.property.id, context, options)} has empty value range</span>;

        case ResultType.Cardinality:
            return <span>{renderRdfTerm(result.property.id, context, options)} &#x25B9; found {result.actualCount} but expected {renderCardinality(result.property.minCount, result.property.maxCount, { noSymbols: true })}</span>;
        case ResultType.MissingClass:
            return <span>{renderRdfTerm(result.classID, context, options)} is not in schema</span>;
        case ResultType.NotSatisfied:
            return <span>{renderRdfTerm(result.property.id, context, options)} &#x25B9; {renderRdfTerm(result.object, context, options)} is not an instance of/equal to {Ix.from(result.property.value).map(v => renderRdfTerm(v, context, options)).intersperse(" or ")}</span>;
    }
}

function renderResultWithSeverity(result: ValidationResult, context: RenderContext): HtmlContent {
    switch (result.severity) {
        case ResultSeverity.Error:
            return <><span class="validation-error">error:</span> {renderResult(result, context)}</>;
        case ResultSeverity.Warning:
            return <><span class="validation-warning">warning:</span> {renderResult(result, context)}</>;
    }
}

export default function render(subject: IRIOrBlankNode, context: RenderContext): HtmlContent {
    const results: ValidationResult[] = Schema.validate(subject, context.graph, context.schema);

    return results.length ?
        <section>
            <h2>Validation</h2>
            <ul class="validation-results">
                {Ix.from(results).map(r => <li>{renderResultWithSeverity(r, context)}</li>)}
            </ul>
        </section> : <></>;
}
