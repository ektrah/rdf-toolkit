import { Triple } from "../triples.js";
import { Rdf, Rdfs, Xsd } from "../vocab.js";

// https://www.w3.org/TR/2014/REC-rdf11-concepts-20140225/#xsd-datatypes
export class XSDEngine {

    constructor() {
    }

    ingest(triple: Triple): boolean {
        return false;
    }

    *beforeinterpret(): Generator<Triple> {
        yield Triple.createAxiomatic(Xsd.string, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.boolean, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.decimal, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.integer, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.double, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.float, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.date, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.time, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.dateTime, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.dateTimeStamp, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.gYear, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.gMonth, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.gDay, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.gYearMonth, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.gMonthDay, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.duration, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.yearMonthDuration, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.dayTimeDuration, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.byte, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.short, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.int, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.long, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.unsignedByte, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.unsignedShort, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.unsignedInt, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.unsignedLong, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.positiveInteger, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.nonNegativeInteger, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.negativeInteger, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.nonPositiveInteger, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.hexBinary, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.base64Binary, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.anyURI, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.language, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.normalizedString, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.token, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.NMTOKEN, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.Name, Rdf.type, Rdfs.Datatype);
        yield Triple.createAxiomatic(Xsd.NCName, Rdf.type, Rdfs.Datatype);
    }

    *interpret(triple: Triple): Generator<Triple> {
    }

    *afterinterpret(): Generator<Triple> {
    }
}
