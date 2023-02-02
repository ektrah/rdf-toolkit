import { BlankNode, IRI } from "@rdf-toolkit/rdf/terms";
import { Triple, TripleLocation } from "@rdf-toolkit/rdf/triples";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import renderRdfTerm, { RenderOptions } from "./rdf-term.js";
import "./rdf.css";

function renderLocation(location: TripleLocation, context: RenderContext): HtmlContent {
    return <span>
        {renderRdfTerm(IRI.create(location.uri), context, { expandIRIs: true, rawIRIs: true, hideError: true })}
        {":"}
        {location.objectRange.start.line + 1}
        {":"}
        {location.objectRange.start.character + 1}
    </span>;
}

function renderProvenance(triple: Triple, context: RenderContext): HtmlContent {
    if (Triple.isParsed(triple)) {
        return <> <span class="rdf-provenance">[from {renderLocation(triple.location, context)}]</span></>;
    }
    else if (Triple.isAxiomatic(triple)) {
        return <> <span class="rdf-provenance">[axiom]</span></>;
    }
    else if (Triple.isInferred(triple)) {
        for (let i = 0; i < 10 && Triple.isInferred(triple); i++) {
            triple = triple.premise;
        }
        if (Triple.isParsed(triple)) {
            return <> <span class="rdf-provenance">[inferred from {renderLocation(triple.location, context)}]</span></>;
        }
        else if (Triple.isAxiomatic(triple)) {
            return <> <span class="rdf-provenance">[inferred from axiom]</span></>;
        }
        else {
            return <> <span class="rdf-provenance">[inferred]</span></>;
        }
    }
    else {
        return <></>;
    }
}

function renderPredicateAndObject(triple: Triple, context: RenderContext, options: RenderOptions): HtmlContent {
    if (BlankNode.is(triple.subject)) {
        options = Object.assign<RenderOptions, RenderOptions, RenderOptions>({}, options, { hiddenNodes: [triple.subject, ...options.hiddenNodes || []] });
    }

    return <>
        {renderRdfTerm(triple.predicate, context, options)}
        {" "}
        {renderRdfTerm(triple.object, context, options)}
    </>;
}

function renderSubjectAndPredicateAndObject(triple: Triple, context: RenderContext, options: RenderOptions): HtmlContent {
    return <>
        {renderRdfTerm(triple.subject, context, options)}
        {IRI.is(triple.subject) ? <> {renderPredicateAndObject(triple, context, options)}</> : null}
    </>;
}

export default function render(triple: Triple, context: RenderContext, options: RenderOptions = {}, includeSubject = false): HtmlContent {
    return <>
        {includeSubject ? renderSubjectAndPredicateAndObject(triple, context, options) : renderPredicateAndObject(triple, context, options)}
        {renderProvenance(triple, context)}
    </>;
}
