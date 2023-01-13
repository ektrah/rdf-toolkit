import { Literal } from "@rdf-toolkit/rdf/terms";
import { Xsd } from "@rdf-toolkit/rdf/vocab";
import renderRdfTerm from "../components/rdf-term.js";
import { RenderContext } from "../context.js";
import { HtmlContent } from "../jsx/html.js";
import "./footer.css";

const repositoryURL: Literal = Literal.create("https://github.com/ektrah/rdf-toolkit", Xsd.anyURI);

export default function render(context: RenderContext): HtmlContent {
    return <>
        <details>
            <summary>Terms of use</summary>
            <p>
                This website uses heuristics to determine the schema of RDF vocabulary.
                This process is not perfect and may not always provide an accurate view of the underlying RDF data.
                Users are advised to use the output of this website as a guide only and to check the accuracy of the results against the original Turtle files.
            </p>
            <p>
                This website is provided &ldquo;as is&rdquo;, without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement.
                In no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in an action of contract, tort or otherwise, arising from, out of or in connection with the website or the use or other dealings in the website.
            </p>
        </details>
        <details>
            <summary>Privacy notice</summary>
            <p>
                This website does not collect or process any information provided by users.
                All information, including all Turtle files, is stored in the browser and is not uploaded to any servers.
                This ensures that your data is never shared with anyone and remains private.
            </p>
        </details>
        <details>
            <summary>Report a bug</summary>
            <p>
                If you find an issue with the functioning of this website, please report it in {renderRdfTerm(repositoryURL, context, { linkContents: "the GitHub repository", anyURIAsLink: true })} by opening a new issue.
                Include as much detail as possible in your report, including steps to reproduce the issue if possible. Thank you for helping improve RDF Explorer!
            </p>
        </details>
    </>;
}
