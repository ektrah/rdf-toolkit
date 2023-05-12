import { Graph } from "@rdf-toolkit/rdf/graphs";
import { IRIOrBlankNode, Literal, Term } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple } from "@rdf-toolkit/rdf/triples";
import { Rdf, Xsd } from "@rdf-toolkit/rdf/vocab";
import { Class, ClassProperty, Property, Schema } from "@rdf-toolkit/schema";
import { SyntaxToken, SyntaxTree, TokenKind } from "@rdf-toolkit/turtle";
import * as os from "node:os";
import * as process from "node:process";
import { printDiagnosticsAndExitOnError } from "../diagnostics.js";
import { Project } from "../model/project.js";
import { DiagnosticOptions, ForceOptions, MakeOptions, ProjectOptions } from "../options.js";
import { PrefixTable } from "../prefixes.js";
import { Workspace } from "../workspace.js";

type Options =
    & DiagnosticOptions
    & ForceOptions
    & MakeOptions
    & ProjectOptions

export default function main(format: "text" | "jsonld", options: Options): void {
    const project = new Project(options.project);
    const output = new Workspace(project.package.resolve(options.output || "."));

    const dataset: ParsedTriple[][] = [];
    const namespaces: Record<string, string>[] = [{
        "_": "http://example.com/.well-known/genid/",
        "dc11": "http://purl.org/dc/elements/1.1/",
        "dcmitype": "http://purl.org/dc/dcmitype/",
        "dcterms": "http://purl.org/dc/terms/",
        "owl": "http://www.w3.org/2002/07/owl#",
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
        "sh": "http://www.w3.org/ns/shacl#",
        "xsd": "http://www.w3.org/2001/XMLSchema#",
    }];

    //for (const file of project.package.files.values()) {
    //    if (file) {
    for (const fileSet of project.files.values()) {
        for (const file of fileSet) {
            process.stderr.write("Compiling <" + file.documentURI + ">" + os.EOL);
            const syntaxTree = file.syntaxTree;
            const parserState = SyntaxTree.compileTriples(syntaxTree, project.diagnostics, { returnParserState: true });
            dataset.push(parserState.triples);
            namespaces.push(parserState.namespaces);
        }
    }

    printDiagnosticsAndExitOnError(project.diagnostics, options);

    process.stderr.write("Reasoning over graph" + os.EOL);
    const graph = Graph.from(dataset);

    process.stderr.write("Generating schema" + os.EOL);
    const schema = Schema.decompile(dataset, graph);
    const prefixes = new PrefixTable(namespaces);

    switch (format) {
        case "text":
            process.stderr.write("Writing schema.txt" + os.EOL);
            output.writeText("schema.txt", renderSchema(schema, prefixes), !options.force);
            break;

        case "jsonld":
            process.stderr.write("Writing schema.json" + os.EOL);
            output.writeJSON("schema.json", convertSchemaToJSON(schema, prefixes), !options.force);
            break;
    }
}

function renderCardinality(minCount: bigint, maxCount: bigint): string {
    if (minCount === 1n && maxCount === 1n) {
        return "";
    }
    else if (minCount === 0n && maxCount === 1n) {
        return "?";
    }
    else if (minCount === 1n && maxCount < 0n) {
        return "+";
    }
    else if (minCount === 0n && maxCount < 0n) {
        return "*";
    }

    if (minCount === maxCount) {
        return minCount.toString();
    }
    else if (minCount > maxCount) {
        return minCount.toString() + "..*";
    }
    else {
        return minCount.toString() + ".." + maxCount.toString();
    }
}

function renderRdfTerm(term: Term, prefixes: PrefixTable): string {
    if (Literal.is(term)) {
        return SyntaxToken.create(TokenKind.STRING_LITERAL_QUOTE, term.value).text + "^^" + renderRdfTerm(term.datatype, prefixes);
    }
    else if (term === Rdf.type) {
        return "a";
    }
    else {
        const prefixedName = prefixes.lookup(term.value);
        return prefixedName ? prefixedName.prefixLabel + ":" + prefixedName.localName : "<" + term.value + ">";
    }
}

function renderClassCode(class_: Class, prefixes: PrefixTable): string {
    return "class " + renderRdfTerm(class_.id, prefixes) +
        (
            class_.subClassOf.length === 0
                ? ""
                : " extends " +
                (
                    class_.subClassOf.length === 1
                        ? renderRdfTerm(class_.subClassOf[0], prefixes) + (class_.properties.length ? "" : " .")
                        : class_.subClassOf.map((c, i) => renderRdfTerm(c, prefixes) + (i + 1 < class_.subClassOf.length ? ", " : (class_.properties.length ? "" : " ."))).join("")
                )
        ) + (
            class_.properties.length === 0
                ? ""
                : os.EOL + "{" +
                (
                    class_.properties.map(p =>
                        os.EOL + "    " +
                        renderCardinality(p.minCount, p.maxCount) +
                        renderRdfTerm(p.id, prefixes) +
                        " " +
                        (
                            p.value.length === 0
                                ? "()"
                                : p.value.length === 1
                                    ? renderRdfTerm(p.value[0], prefixes) + ";"
                                    : p.value.map((v, i) => (i === 0 ? "( " : "| ") + renderRdfTerm(v, prefixes) + " ").join("") + ")"
                        )
                    ).join("")
                ) +
                os.EOL + "}"
        );
}

function renderSchema(schema: Schema, prefixes: PrefixTable): string {
    return Array.from(schema.classes.values()).sort((a, b) => a.id.compareTo(b.id)).map(class_ => renderClassCode(class_, prefixes)).join(os.EOL + os.EOL) + os.EOL;
}

type ID = {
    "@id": string
}

type ValueJSON =
    | string
    | { "@type": string, "@value": string }
    | ID

type ClassPropertyJSON = {
    property: ID,
    description?: string,
    values?: ValueJSON | ValueJSON[],
    minCount: number,
    maxCount: number,
    deprecated?: true,
}

type ClassJSON = ID & {
    description?: string,
    subClassOf?: ID | ID[],
    properties?: ClassPropertyJSON | ClassPropertyJSON[],
    deprecated?: true,
}

type PropertyJSON = ID & {
    description?: string,
    subPropertyOf?: ID | ID[],
}

type SchemaJSON = {
    "@context": Readonly<Record<string, string>>,
    "classes"?: ClassJSON | ClassJSON[],
    "properties"?: PropertyJSON | PropertyJSON[],
}

function compactArray<T>(items: T[]): undefined | T | T[] {
    switch (items.length) {
        case 0:
            return;
        case 1:
            return items[0];
        default:
            return items;
    }
}

function convertTermToJSON(value: IRIOrBlankNode, prefixes: PrefixTable): ID {
    const prefixedName = prefixes.lookup(value.value);
    return { "@id": prefixedName ? prefixedName.prefixLabel + ":" + prefixedName.localName : value.value };
}

function convertPropertyValueToJSON(value: Term, prefixes: PrefixTable): ValueJSON {
    if (!Literal.is(value)) {
        return convertTermToJSON(value, prefixes);
    }
    else if (value.datatype === Xsd.string) {
        return value.value;
    }
    else {
        return { "@type": value.datatype.value, "@value": value.value };
    }
}

function convertClassPropertyToJSON(classProperty: ClassProperty, prefixes: PrefixTable): ClassPropertyJSON {
    return {
        property: convertTermToJSON(classProperty.id, prefixes),
        description: classProperty.description,
        values: Array.from(classProperty.value).sort((a, b) => a.compareTo(b)).map(value => convertPropertyValueToJSON(value, prefixes)),
        minCount: Number(classProperty.minCount),
        maxCount: Number(classProperty.maxCount),
        deprecated: classProperty.deprecated ? true as const : undefined,
    };
}

function convertClassToJSON(class_: Class, prefixes: PrefixTable): ClassJSON {
    return Object.assign(convertTermToJSON(class_.id, prefixes), {
        description: class_.description,
        subClassOf: compactArray(Array.from(class_.subClassOf).sort((a, b) => a.compareTo(b)).map(subClass => convertTermToJSON(subClass, prefixes))),
        properties: Array.from(class_.properties).sort((a, b) => a.id.compareTo(b.id)).map(classProperty => convertClassPropertyToJSON(classProperty, prefixes)),
        deprecated: class_.deprecated ? true as const : undefined,
    });
}

function convertPropertyToJSON(property: Property, prefixes: PrefixTable): PropertyJSON {
    return Object.assign(convertTermToJSON(property.id, prefixes), {
        description: property.description,
        subPropertyOf: compactArray(Array.from(property.subPropertyOf).sort((a, b) => a.compareTo(b)).map(subClass => convertTermToJSON(subClass, prefixes))),
    });
}

function convertPrefixesToJSON(prefixes: PrefixTable): Record<string, string> {
    const mapping: Record<string, string> = {
        "@vocab": "http://example.com/vocab/",
    };
    for (const [namespaceIRI, prefixLabel] of Array.from(prefixes.all()).sort(([, a], [, b]) => a.localeCompare(b))) {
        if (prefixLabel !== "_") {
            mapping[prefixLabel] = namespaceIRI;
        }
    }
    return mapping;
}

function convertSchemaToJSON(schema: Schema, prefixes: PrefixTable): SchemaJSON {
    return {
        "@context": convertPrefixesToJSON(prefixes),
        "classes": Array.from(schema.classes.values()).sort((a, b) => a.id.compareTo(b.id)).map(class_ => convertClassToJSON(class_, prefixes)),
        "properties": Array.from(schema.properties.values()).sort((a, b) => a.id.compareTo(b.id)).map(property => convertPropertyToJSON(property, prefixes)),
    };
}
