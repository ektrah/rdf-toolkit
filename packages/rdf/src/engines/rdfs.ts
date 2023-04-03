import { MultiMap } from "@rdf-toolkit/iterable";
import { IRI, IRIOrBlankNode, Literal } from "../terms.js";
import { Triple } from "../triples.js";
import { Rdf, Rdfs } from "../vocab.js";

// https://www.w3.org/TR/2014/REC-rdf11-mt-20140225/#rdfs-interpretations
export class RDFSEngine {

    readonly domainMap: MultiMap<IRI, IRIOrBlankNode>;                //  {Property} -- rdfs:domain --> {Class}
    readonly rangeMap: MultiMap<IRI, IRIOrBlankNode>;                 //  {Property} -- rdfs:range --> {Class}
    readonly subClassOfMap: MultiMap<IRIOrBlankNode, IRIOrBlankNode>; //  {Class} -- rdfs:subClassOf --> {Class}
    readonly subPropertyOfMap: MultiMap<IRI, IRI>;                    //  {Property} -- rdfs:subPropertyOf --> {Property}

    constructor() {
        this.domainMap = new MultiMap();
        this.rangeMap = new MultiMap();
        this.subClassOfMap = new MultiMap();
        this.subPropertyOfMap = new MultiMap();
    }

    ingest(triple: Triple): boolean {
        switch (triple.predicate) {
            case Rdfs.domain:
                return IRI.is(triple.subject) && IRIOrBlankNode.is(triple.object) && this.domainMap.add(triple.subject, triple.object);
            case Rdfs.range:
                return IRI.is(triple.subject) && IRIOrBlankNode.is(triple.object) && this.rangeMap.add(triple.subject, triple.object);
            case Rdfs.subClassOf:
                return IRIOrBlankNode.is(triple.object) && this.subClassOfMap.add(triple.subject, triple.object);
            case Rdfs.subPropertyOf:
                return IRI.is(triple.subject) && IRI.is(triple.object) && this.subPropertyOfMap.add(triple.subject, triple.object);
            default:
                return false;
        }
    }

    *beforeinterpret(): Generator<Triple> {
        yield Triple.createAxiomatic(Rdfs.domain, Rdfs.domain, Rdf.Property);
        yield Triple.createAxiomatic(Rdfs.range, Rdfs.domain, Rdf.Property);
        yield Triple.createAxiomatic(Rdfs.subPropertyOf, Rdfs.domain, Rdf.Property);
        yield Triple.createAxiomatic(Rdfs.subClassOf, Rdfs.domain, Rdfs.Class);
        yield Triple.createAxiomatic(Rdfs.member, Rdfs.domain, Rdfs.Resource);
        yield Triple.createAxiomatic(Rdfs.seeAlso, Rdfs.domain, Rdfs.Resource);
        yield Triple.createAxiomatic(Rdfs.isDefinedBy, Rdfs.domain, Rdfs.Resource);
        yield Triple.createAxiomatic(Rdfs.comment, Rdfs.domain, Rdfs.Resource);
        yield Triple.createAxiomatic(Rdfs.label, Rdfs.domain, Rdfs.Resource);

        yield Triple.createAxiomatic(Rdfs.domain, Rdfs.range, Rdfs.Class);
        yield Triple.createAxiomatic(Rdfs.range, Rdfs.range, Rdfs.Class);
        yield Triple.createAxiomatic(Rdfs.subPropertyOf, Rdfs.range, Rdf.Property);
        yield Triple.createAxiomatic(Rdfs.subClassOf, Rdfs.range, Rdfs.Class);
        yield Triple.createAxiomatic(Rdfs.member, Rdfs.range, Rdfs.Resource);
        yield Triple.createAxiomatic(Rdfs.seeAlso, Rdfs.range, Rdfs.Resource);
        yield Triple.createAxiomatic(Rdfs.isDefinedBy, Rdfs.range, Rdfs.Resource);
        yield Triple.createAxiomatic(Rdfs.comment, Rdfs.range, Rdfs.Literal);
        yield Triple.createAxiomatic(Rdfs.label, Rdfs.range, Rdfs.Literal);

        yield Triple.createAxiomatic(Rdfs.ContainerMembershipProperty, Rdfs.subClassOf, Rdf.Property);
        yield Triple.createAxiomatic(Rdfs.Datatype, Rdfs.subClassOf, Rdfs.Class);

        yield Triple.createAxiomatic(Rdfs.isDefinedBy, Rdfs.subPropertyOf, Rdfs.seeAlso);
    }

    *interpret(triple: Triple): Generator<Triple> {
        {
            const yyy = triple.object;

            // rdfs1
            if (Literal.is(yyy)) {
                yield Triple.createInferred(yyy.datatype, Rdf.type, Rdfs.Datatype, triple);
            }
        }

        {
            const xxx = triple.subject;
            const aaa = triple.predicate;
            const yyy = triple.object;

            // rdfs4a
            yield Triple.createInferred(xxx, Rdf.type, Rdfs.Resource, triple);

            // rdfs4b
            if (IRIOrBlankNode.is(yyy)) {
                yield Triple.createInferred(yyy, Rdf.type, Rdfs.Resource, triple);
            }

            // rdfs7
            for (const bbb of this.subPropertyOfMap.get(aaa)) {
                yield Triple.createInferred(xxx, bbb, yyy, triple);
            }

            // axiom
            if (aaa.value.startsWith(Rdf._IRI + "_")) {
                yield Triple.createAxiomatic(aaa, Rdf.type, Rdfs.ContainerMembershipProperty);
                yield Triple.createAxiomatic(aaa, Rdfs.domain, Rdfs.Resource);
                yield Triple.createAxiomatic(aaa, Rdfs.range, Rdfs.Resource);
            }
        }

        {
            const yyy = triple.subject;
            const aaa = triple.predicate;
            const zzz = triple.object;

            // rdfs2
            for (const xxx of this.domainMap.get(aaa)) {
                yield Triple.createInferred(yyy, Rdf.type, xxx, triple);
            }

            // rdfs3
            if (IRIOrBlankNode.is(zzz)) {
                for (const xxx of this.rangeMap.get(aaa)) {
                    yield Triple.createInferred(zzz, Rdf.type, xxx, triple);
                }
            }
        }

        switch (triple.predicate) {
            case Rdf.type:
                {
                    const zzz = triple.subject;
                    const xxx = triple.object;

                    // rdfs9
                    if (IRIOrBlankNode.is(xxx)) {
                        for (const yyy of this.subClassOfMap.get(xxx)) {
                            yield Triple.createInferred(zzz, Rdf.type, yyy, triple);
                        }
                    }
                }

                switch (triple.object) {
                    case Rdf.Property:
                        {
                            const xxx = triple.subject;

                            // rdfs6
                            yield Triple.createInferred(xxx, Rdfs.subPropertyOf, xxx, triple);
                        }
                        break;

                    case Rdfs.ContainerMembershipProperty:
                        {
                            const xxx = triple.subject;

                            // rdfs12
                            yield Triple.createInferred(xxx, Rdfs.subPropertyOf, Rdfs.member, triple);
                        }
                        break;

                    case Rdfs.Class:
                        {
                            const xxx = triple.subject;

                            // rdfs8
                            yield Triple.createInferred(xxx, Rdfs.subClassOf, Rdfs.Resource, triple);

                            // rdfs10
                            yield Triple.createInferred(xxx, Rdfs.subClassOf, xxx, triple);
                        }
                        break;

                    case Rdfs.Datatype:
                        {
                            const xxx = triple.subject;

                            // rdfs13
                            yield Triple.createInferred(xxx, Rdfs.subClassOf, Rdfs.Literal, triple);
                        }
                        break;
                }
                break;

            case Rdfs.subClassOf:
                {
                    const xxx = triple.subject;
                    const yyy = triple.object;

                    // rdfs11
                    if (IRIOrBlankNode.is(yyy)) {
                        for (const zzz of this.subClassOfMap.get(yyy)) {
                            yield Triple.createInferred(xxx, Rdfs.subClassOf, zzz, triple);
                        }
                    }
                }
                break;

            case Rdfs.subPropertyOf:
                {
                    const xxx = triple.subject;
                    const yyy = triple.object;

                    // rdfs5
                    if (IRI.is(yyy)) {
                        for (const zzz of this.subPropertyOfMap.get(yyy)) {
                            yield Triple.createInferred(xxx, Rdfs.subPropertyOf, zzz, triple);
                        }
                    }
                }
                break;
        }
    }

    *afterinterpret(): Generator<Triple> {
    }
}
