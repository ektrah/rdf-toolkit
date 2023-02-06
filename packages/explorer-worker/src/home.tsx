import { RenderContext } from "@rdf-toolkit/explorer-views/context";
import { HtmlContent } from "@rdf-toolkit/explorer-views/jsx/html";
import renderFooter from "@rdf-toolkit/explorer-views/sections/footer";

export default function render(context: RenderContext): HtmlContent {
    return <>
        <section>
            <h1>&#x1F141;&#x1F133;&#x1F135; Explorer</h1>
            <p>
                Welcome to RDF Explorer!
                This website allows you to explore RDF graphs.
                Here&rsquo;s how it works:
            </p>
            <ol>
                <li>Simply drag and drop some Turtle files into the browser window.</li>
                <li>The files will be parsed and the resulting graph will be displayed.</li>
                <li>You can then click through the graph to explore its contents.</li>
            </ol>
            <p>Have fun!</p>
        </section>
        <footer>
            {renderFooter(context)}
        </footer>
    </>;
}
