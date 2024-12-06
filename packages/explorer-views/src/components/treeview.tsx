import { Ix } from "@rdf-toolkit/iterable";
import { IRI, IRIOrBlankNode } from "@rdf-toolkit/rdf/terms";
import { HtmlContent } from "../jsx/html.js";
import "./treeview.css";

export interface TreeNode {
    readonly id: IRIOrBlankNode;
    readonly label: HtmlContent;
    readonly children?: Iterable<TreeNode>;
    readonly open?: boolean;
}

function renderNode(node: TreeNode, depth: number): HtmlContent {
    return depth > 9 ? <li>{"\u2026"}</li> : Ix.from(node.children)
        .map(child => renderNode(child, node.open ? 1 : depth + 1))
        .wrap(children =>
            <li>
                <details open={node.open || depth > 3} iri={node.id.value}>
                    <summary>{node.label}</summary>
                    {depth >= 9 ? "\u2026" : <ul>{children}</ul>}
                </details>
            </li>,
            <li>
                {node.label}
            </li>);
}

export default function render(roots: Iterable<TreeNode>): HtmlContent {
    return <ul class="tree">
        {Ix.from(roots).map(root => renderNode(root, 0))}
    </ul>;
}
