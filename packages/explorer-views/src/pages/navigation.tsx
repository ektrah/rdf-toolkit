import { Ix } from "@rdf-toolkit/iterable";
import { IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { Owl, Rdfs } from "@rdf-toolkit/rdf/vocab";
import { Class, Ontology, Property } from "@rdf-toolkit/schema";
import renderRdfTerm, { RenderOptions } from "../components/rdf-term.js";
import renderTabView from "../components/tabview.js";
import renderTreeView, { TreeNode } from "../components/treeview.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./navigation.css";

function createTree<T extends Class | Property | Ontology>(items: Iterable<T>, parents: (item: T) => Iterable<IRIOrBlankNode>, context: RenderContext, options?: RenderOptions): TreeNode[] {
    const roots: TreeNode[] = [];
    const tree: { [P in string]: { readonly label: HtmlContent; readonly children: TreeNode[], readonly open: boolean } } = {};
    for (const item of items) {
        if (IRI.is(item.id)) {
            const node = tree[item.id.value] || (tree[item.id.value] = { label: renderRdfTerm(item.id, context, options), children: [], open: item.id === Rdfs.Resource || item.id === Owl.Thing });
            let hasParents = false;
            for (const parent of parents(item)) {
                (tree[parent.value] || (tree[parent.value] = { label: renderRdfTerm(parent, context, options), children: [], open: parent === Rdfs.Resource || parent === Owl.Thing })).children.push(node);
                hasParents = true;
            }
            if (!hasParents) {
                roots.push(node);
            }
        }
    }
    return roots;
}

export default function render(title: string | undefined, context: RenderContext): HtmlContent {
    return <>
        <p class="logo">{title || "\u{1F141}\u{1F133}\u{1F135} Explorer"}</p>
        {
            renderTabView("navigation", [
                {
                    id: "navigation-classes",
                    label: "Classes",
                    content: renderTreeView(createTree(context.schema.classes.values(), x => x.subClassOf, context, { rawBlankNodes: true }))
                },
                {
                    id: "navigation-properties",
                    label: "Properties",
                    content: renderTreeView(createTree(context.schema.properties.values(), x => x.subPropertyOf, context, { rawBlankNodes: true }))
                },
                {
                    id: "navigation-ontologies",
                    label: "Ontologies",
                    content: renderTreeView(createTree(context.schema.ontologies.values(), () => Ix.empty, context, { rawIRIs: true, rawBlankNodes: true }))
                },
                {
                    id: "navigation-files",
                    label: "Files",
                    content: renderTreeView(Object.keys(context.documents).sort().map<TreeNode>(x => ({ label: renderRdfTerm(IRI.create(x), context, { rawIRIs: true, hideError: true }) })))
                },
            ])
        }
    </>;
}
