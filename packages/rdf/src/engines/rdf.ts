import { MultiMap } from "@rdf-toolkit/iterable";
import { IRIOrBlankNode } from "../terms.js";
import { Triple } from "../triples.js";
import { Rdf } from "../vocab.js";

// https://www.w3.org/TR/2014/REC-rdf11-mt-20140225/#rdf-interpretations
export class RDFEngine {

    readonly typeMap: MultiMap<IRIOrBlankNode, IRIOrBlankNode>;       //  {Class} <-- rdf:type -- {Resource}

    readonly firstMap: Map<IRIOrBlankNode, Triple> = new Map();
    readonly restMap: Map<IRIOrBlankNode, Triple> = new Map();

    constructor() {
        this.typeMap = new MultiMap();
    }

    ingest(triple: Triple): boolean {
        switch (triple.predicate) {
            case Rdf.type:
                return IRIOrBlankNode.is(triple.object) && this.typeMap.add(triple.object, triple.subject);
            case Rdf.first:
                this.firstMap.set(triple.subject, triple);
                return false;
            case Rdf.rest:
                this.restMap.set(triple.subject, triple);
                return false;
            default:
                return false;
        }
    }

    *beforeinterpret(): Generator<Triple> {
        yield Triple.createAxiomatic(Rdf.type, Rdf.type, Rdf.Property);
        yield Triple.createAxiomatic(Rdf.subject, Rdf.type, Rdf.Property);
        yield Triple.createAxiomatic(Rdf.predicate, Rdf.type, Rdf.Property);
        yield Triple.createAxiomatic(Rdf.object, Rdf.type, Rdf.Property);
        yield Triple.createAxiomatic(Rdf.first, Rdf.type, Rdf.Property);
        yield Triple.createAxiomatic(Rdf.rest, Rdf.type, Rdf.Property);
        yield Triple.createAxiomatic(Rdf.value, Rdf.type, Rdf.Property);
        yield Triple.createAxiomatic(Rdf.nil, Rdf.type, Rdf.List);
    }

    *interpret(triple: Triple): Generator<Triple> {
        {
            // rdfD1
        }

        {
            const aaa = triple.predicate;

            // rdfD2
            yield Triple.createInferred(aaa, Rdf.type, Rdf.Property, triple);
        }
    }

    *afterinterpret(): Generator<Triple> {
    }
}
