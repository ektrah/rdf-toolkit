import { HtmlContent } from "../jsx/html.js";
import "./cardinality.css";

export default function render(minCount: bigint, maxCount: bigint, options: { noSymbols?: boolean } = {}): HtmlContent {
    if (!options.noSymbols) {
        if (minCount === 1n && maxCount === 1n) {
            return <></>;
        }
        else if (minCount === 0n && maxCount === 1n) {
            return <abbr class="schema-keyword" title="optional">?</abbr>
        }
        else if (minCount === 1n && maxCount < 0n) {
            return <abbr class="schema-keyword" title="one or more">+</abbr>;
        }
        else if (minCount === 0n && maxCount < 0n) {
            return <abbr class="schema-keyword" title="zero or more">*</abbr>;
        }
    }

    if (minCount === maxCount) {
        return <abbr class="schema-keyword" title={"exactly " + minCount}>{minCount}</abbr>;
    }
    else if (minCount > maxCount) {
        return <abbr class="schema-keyword" title={minCount + " or more"}>{minCount}..*</abbr>;
    }
    else {
        return <abbr class="schema-keyword" title={minCount + " to " + maxCount + " (inclusive)"}>{minCount}..{maxCount}</abbr>;
    }
}
