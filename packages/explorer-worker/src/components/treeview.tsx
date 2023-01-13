import { Ix } from "@rdf-toolkit/iterable";
import { HtmlContent } from "../jsx/html.js";
import "./treeview.css";

export interface TreeNode {
    readonly label: HtmlContent;
    readonly children?: Iterable<TreeNode>;
    readonly open?: boolean;
}

function renderNode(node: TreeNode, depth: number): HtmlContent {
    return depth >= 32 ? "\u2026" : Ix.from(node.children)
        .map(child => renderNode(child, node.open ? 1 : depth + 1))
        .wrap(children =>
            <li>
                <details open={node.open || depth > 3}>
                    <summary>{node.label}</summary>
                    <ul>{children}</ul>
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
