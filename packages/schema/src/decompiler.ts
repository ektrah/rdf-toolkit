import { Graph } from "@rdf-toolkit/rdf/graphs";
import { Triple } from "@rdf-toolkit/rdf/triples";
import decompileOwl from "./decompiler/owl.js";
import decompileRdfs from "./decompiler/rdfs.js";
import decompileShacl from "./decompiler/shacl.js";
import { SchemaBuilder } from "./decompiler/utils.js";
import { Schema } from "./main.js";

export default function decompile(dataset: Iterable<Iterable<Triple>>, graph: Graph): Schema {
    const builder = new SchemaBuilder();
    decompileOwl(graph, builder);
    decompileShacl(graph, builder);
    decompileRdfs(graph, builder);
    return builder.toSchema(dataset, graph);
}
