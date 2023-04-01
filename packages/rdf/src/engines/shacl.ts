import { Triple } from "../triples.js";
import { Rdf, Rdfs, Shacl } from "../vocab.js";

// https://www.w3.org/TR/2017/REC-shacl-20170720/
export class SHACLEngine {

    constructor() { }

    ingest(_triple: Triple): boolean {
        return false;
    }

    *beforeinterpret(): Generator<Triple> {
    }

    *interpret(triple: Triple): Generator<Triple> {

        switch (triple.predicate) {
            case Shacl.class:
            case Shacl.returnType:
            case Shacl.targetClass:
                yield Triple.createAxiomatic(triple.predicate, Rdfs.range, Rdfs.Class);
                break;

            case Shacl.datatype:
                yield Triple.createAxiomatic(triple.predicate, Rdfs.range, Rdfs.Datatype);
                break;

            case Shacl.annotationProperty:
            case Shacl.disjoint:
            case Shacl.equals:
            case Shacl.lessThan:
            case Shacl.lessThanOrEquals:
            case Shacl.targetObjectsOf:
            case Shacl.targetSubjectsOf:
                yield Triple.createAxiomatic(triple.predicate, Rdfs.range, Rdf.Property);
                break;

            case Shacl.alternativePath:
            case Shacl.and:
            case Shacl.ignoredProperties:
            case Shacl.in:
            case Shacl.languageIn:
            case Shacl.or:
            case Shacl.xone:
                yield Triple.createAxiomatic(triple.predicate, Rdfs.range, Rdf.List);
                break;
        }
    }

    *afterinterpret(): Generator<Triple> {
    }
}
