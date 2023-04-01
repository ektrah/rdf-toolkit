import { Ix, MultiMap, ReadonlyMultiMap } from "@rdf-toolkit/iterable";
import { OWLEngine } from "../engines/owl.js";
import { RDFEngine } from "../engines/rdf.js";
import { RDFSEngine } from "../engines/rdfs.js";
import { IRI, IRIOrBlankNode, Literal, Term } from "../terms.js";
import { Triple } from "../triples.js";
import { Owl, Rdf, Rdfs } from "../vocab.js";
import { IndexedGraph } from "./indexed.js";

export class RichGraph extends IndexedGraph {

    private readonly typeMap: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;         //  {Class} <-- rdf:type -- {Resource}
    private readonly domainMap: ReadonlyMultiMap<IRI, IRIOrBlankNode>;                  //  {Property} -- rdfs:domain --> {Class}
    private readonly rangeMap: ReadonlyMultiMap<IRI, IRIOrBlankNode>;                   //  {Property} -- rdfs:range --> {Class}
    private readonly subClassOfMap: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;   //  {Class} -- rdfs:subClassOf --> {Class}
    private readonly subPropertyOfMap: ReadonlyMultiMap<IRI, IRI>;                      //  {Property} -- rdfs:subPropertyOf --> {Property}

    private readonly types: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;           //  {Resource} -- rdf:type --> {Class}
    private readonly subClasses: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;      //  {Class} <-- rdfs:subClassOf -- {Class}
    private readonly subProperties: ReadonlyMultiMap<IRI, IRI>;                         //  {Property} <-- rdfs:subPropertyOf -- {Property}

    private readonly directInstances: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;
    private readonly directTypes: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;
    private readonly directSuperClasses: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;
    private readonly directSubClasses: ReadonlyMultiMap<IRIOrBlankNode, IRIOrBlankNode>;
    private readonly directSuperProperties: ReadonlyMultiMap<IRI, IRI>;
    private readonly directSubProperties: ReadonlyMultiMap<IRI, IRI>;

    readonly equivalentClassMap: MultiMap<IRIOrBlankNode, IRIOrBlankNode>;              //  {Class} -- owl:equivalentClass --> {Class}

    constructor(dataset: Iterable<Iterable<Triple>>, rdfEngine: RDFEngine, rdfsEngine: RDFSEngine, owlEngine: OWLEngine) {
        super(dataset);

        this.typeMap = rdfEngine.typeMap;
        this.domainMap = rdfsEngine.domainMap;
        this.rangeMap = rdfsEngine.rangeMap;
        this.subClassOfMap = rdfsEngine.subClassOfMap;
        this.subPropertyOfMap = rdfsEngine.subPropertyOfMap;

        this.types = invert(this.typeMap);
        this.subClasses = invert(this.subClassOfMap);
        this.subProperties = invert(this.subPropertyOfMap);

        this.directInstances = directInstances(this.typeMap, this.subClasses);
        this.directTypes = directTypes(this.types, this.subClassOfMap);
        this.directSuperClasses = direct(this.subClassOfMap);
        this.directSubClasses = direct(this.subClasses);
        this.directSuperProperties = direct(this.subPropertyOfMap);
        this.directSubProperties = direct(this.subProperties);

        this.equivalentClassMap = owlEngine.equivalentClassMap;
    }

    // ---

    classes(): Ix<IRIOrBlankNode> {
        return this.typeMap.get(Rdfs.Class);
    }

    domains(): Ix<[IRI, IRIOrBlankNode]> {
        return Ix.from(this.domainMap);
    }

    getInstances(class_: IRIOrBlankNode): Ix<IRIOrBlankNode> {
        return this.typeMap.get(class_);
    }

    getPropertyDomain(property: IRI): Ix<IRIOrBlankNode> {
        return this.getSuperProperties(property).concatMap(p => this.domainMap.get(p)).distinct();
    }

    getPropertyRange(property: IRI): Ix<IRIOrBlankNode> {
        return this.getSuperProperties(property).concatMap(p => this.rangeMap.get(p)).distinct();
    }

    getSuperClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode> {
        return this.subClassOfMap.get(type);
    }

    getSuperProperties(property: IRI): Ix<IRI> {
        return this.subPropertyOfMap.get(property);
    }

    isClass(resource: Term): boolean {
        return IRIOrBlankNode.is(resource) && this.typeMap.has(Rdfs.Class, resource);
    }

    isDatatype(resource: Term): boolean {
        return IRIOrBlankNode.is(resource) && this.typeMap.has(Rdfs.Datatype, resource);
    }

    isInstanceOf(resource: Term, type: IRIOrBlankNode): boolean {
        return Literal.is(resource) ? this.isSubClassOf(resource.datatype, type) : this.typeMap.has(type, resource);
    }

    isProperty(property: Term): boolean {
        return IRI.is(property) && this.typeMap.has(Rdf.Property, property);
    }

    isSubClassOf(resource: Term, class_: IRIOrBlankNode): boolean {
        return IRIOrBlankNode.is(resource) && this.subClassOfMap.has(resource, class_);
    }

    isSubPropertyOf(resource: Term, property: IRI): boolean {
        return IRI.is(resource) && this.subPropertyOfMap.has(resource, property);
    }

    properties(): Ix<IRI> {
        return this.typeMap.get(Rdf.Property).ofType(IRI.is);
    }

    ranges(): Ix<[IRI, IRIOrBlankNode]> {
        return Ix.from(this.rangeMap);
    }

    // ---

    getTypes(resource: Term): Ix<IRIOrBlankNode> {
        return Literal.is(resource) ? this.getSuperClasses(resource.datatype) : this.types.get(resource);
    }

    getSubClasses(class_: IRIOrBlankNode): Ix<IRIOrBlankNode> {
        return this.subClasses.get(class_);
    }

    getSubProperties(property: IRI): Ix<IRI> {
        return this.subProperties.get(property);
    }

    // ---

    getDirectInstances(class_: IRIOrBlankNode): Ix<IRIOrBlankNode> {
        return this.directInstances.get(class_);
    }

    getDirectTypes(resource: Term): Ix<IRIOrBlankNode> {
        return Literal.is(resource) ? Ix.of(resource.datatype) : this.directTypes.get(resource);
    }

    getDirectSuperClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode> {
        return this.directSuperClasses.get(type);
    }

    getDirectSubClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode> {
        return this.directSubClasses.get(type);
    }

    getDirectSuperProperties(property: IRI): Ix<IRI> {
        return this.directSuperProperties.get(property);
    }

    getDirectSubProperties(property: IRI): Ix<IRI> {
        return this.directSubProperties.get(property);
    }

    // ---

    getEquivalentClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode> {
        return this.equivalentClassMap.get(type);
    }

    isDeprecated(resource: IRIOrBlankNode): boolean {
        return this.isInstanceOf(resource, Owl.DeprecatedClass) ||
            this.isInstanceOf(resource, Owl.DeprecatedProperty) ||
            this.triples(resource, Owl.deprecated, Literal.createBoolean(true)).some();
    }
}

function invert<T>(map: ReadonlyMultiMap<T, T>): MultiMap<T, T> {
    const result = new MultiMap<T, T>();
    for (const [x, y] of map) {
        result.add(y, x);
    }
    return result;
}

function direct<T>(map: ReadonlyMultiMap<T, T>): MultiMap<T, T> {
    const result = new MultiMap<T, T>(map);
    for (const [x, y] of map) {
        if (x === y) {
            result.delete(x, y);
        }
        else {
            for (const z of map.get(y)) {
                if (z !== y) {
                    result.delete(x, z);
                }
            }
        }
    }
    return result;
}

function directInstances<T>(map: ReadonlyMultiMap<T, T>, map1: ReadonlyMultiMap<T, T>): MultiMap<T, T> {
    const result = new MultiMap<T, T>(map);
    for (const x of map.keys()) {
        for (const y of map1.get(x)) {
            if (x !== y) {
                for (const z of map.get(y)) {
                    result.delete(x, z);
                }
            }
        }
    }
    return result;
}

function directTypes<T>(map: ReadonlyMultiMap<T, T>, map1: ReadonlyMultiMap<T, T>): MultiMap<T, T> {
    const result = new MultiMap<T, T>(map);
    for (const x of map.keys()) {
        for (const y of map.get(x)) {
            for (const z of map1.get(y)) {
                if (z !== y) {
                    result.delete(x, z);
                }
            }
        }
    }
    return result;
}
