import { Ix } from "@rdf-toolkit/iterable";
import { HtmlContent } from "../jsx/html.js";
import "./tabview.css";

export interface TabViewPage {
    readonly id: string;
    readonly label: string;
    readonly content: HtmlContent;
}

export default function render(name: string, pages: TabViewPage[]): HtmlContent {
    return <div class="tabview">
        {Ix.from(pages).map((page, index) => <input type="radio" name={name} id={page.id} checked={index === 0} />)}
        <div class="tabview-tabs">
            {Ix.from(pages).map(page => <label for={page.id}>{page.label}</label>)}
        </div>
        <div class="tabview-pages">
            {Ix.from(pages).map(page => page.content)}
        </div>
    </div>;
}
