import { Graph } from "@rdf-toolkit/rdf/graphs";
import { Schema } from "@rdf-toolkit/schema";
import { TextDocument } from "@rdf-toolkit/text";

export interface RenderContext {
    readonly documents: Record<string, TextDocument>;
    readonly graph: Graph;
    readonly schema: Schema;

    lookupPrefixedName(iri: string): { readonly prefixLabel: string, readonly localName: string } | null;
}
