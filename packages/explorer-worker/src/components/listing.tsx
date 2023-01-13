import { Ix } from "@rdf-toolkit/iterable";
import { HtmlContent, HtmlElement } from "../jsx/html.js";
import "./listing.css";

export function renderLines(lines: HtmlContent[]): HtmlElement {
    if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        if (lastLine === "" || Array.isArray(lastLine) && lastLine.length === 0) {
            lines.pop();
        }
        else {
            lines.push(<span class="listing-no-newline">No newline at end of file</span>);
        }
    }

    return <div class="listing">
        <table>
            <tbody>
                {Ix.from(lines).map((line, index) => <tr id={"L" + (index + 1)}><td></td><td>{line}</td></tr>)}
            </tbody>
        </table>
    </div>;
}

export function renderPreformatted(content: HtmlContent): HtmlContent {
    return <div class="listing">
        <pre>{content}</pre>
    </div>;
}
