export type HtmlAttributeValue =
    | null
    | bigint
    | boolean
    | number
    | string
    | Iterable<null | string>;

export type HtmlAttributes =
    & { readonly [key: string]: HtmlAttributeValue }
    & { readonly children: HtmlContent };

export interface HtmlElement {
    readonly type: string;
    readonly props: HtmlAttributes;
}

export type HtmlContent =
    | null
    | bigint
    | boolean
    | number
    | string
    | HtmlElement
    | Iterable<HtmlContent>;

const noEndTag: { readonly [key: string]: boolean } = {
    "base": true,
    "link": true,
    "meta": true,
    "hr": true,
    "br": true,
    "wbr": true,
    "source": true,
    "img": true,
    "embed": true,
    "track": true,
    "area": true,
    "col": true,
    "input": true,
}

const entities: { readonly [key: string]: string } = {
    "\x00": "\u2400",
    "\x01": "\u2401",
    "\x02": "\u2402",
    "\x03": "\u2403",
    "\x04": "\u2404",
    "\x05": "\u2405",
    "\x06": "\u2406",
    "\x07": "\u2407",
    "\x08": "\u2408",
    "\x09": "\u2409",
    "\x0A": "\u240A",
    "\x0B": "\u240B",
    "\x0C": "\u240C",
    "\x0D": "\u240D",
    "\x0E": "\u240E",
    "\x0F": "\u240F",
    "\x10": "\u2410",
    "\x11": "\u2411",
    "\x12": "\u2412",
    "\x13": "\u2413",
    "\x14": "\u2414",
    "\x15": "\u2415",
    "\x16": "\u2416",
    "\x17": "\u2417",
    "\x18": "\u2418",
    "\x19": "\u2419",
    "\x1A": "\u241A",
    "\x1B": "\u241B",
    "\x1C": "\u241C",
    "\x1D": "\u241D",
    "\x1E": "\u241E",
    "\x1F": "\u241F",
    "\x20": "\u2420",

    "\"": "&quot;",
    "&": "&amp;",
    "'": "&apos;",
    "<": "&lt;",
    ">": "&gt;",

    "\x7F": "\u2421",
};

function isIterable(x: any): x is Iterable<unknown> {
    return !!x?.[Symbol.iterator];
}

function renderText(s: string): string {
    return s.replace(/[\0-\x1F"&'<>\x7F]/g, c => entities[c]);
}

function renderAttributes(props: HtmlAttributes) {
    let result = "";
    for (const prop in props) {
        if (prop !== "children") {
            const value = props[prop];
            if (typeof value === "bigint") {
                result += " " + prop + "=\"" + value.toString() + "\"";
            }
            else if (typeof value === "boolean") {
                result += value ? " " + prop : "";
            }
            else if (typeof value === "number") {
                result += " " + prop + "=\"" + value.toString() + "\"";
            }
            else if (typeof value === "string") {
                result += " " + prop + "=\"" + renderText(value) + "\"";
            }
            else if (isIterable(value)) {
                let first = true;
                let list = "";
                for (const item of value) {
                    if (typeof item === "string") {
                        if (first) {
                            first = false;
                        }
                        else {
                            list += " ";
                        }
                        list += renderText(item);
                    }
                }
                result += " " + prop + "=\"" + list + "\"";
            }
        }
    }
    return result;
}

export default function render(content: HtmlContent): string {
    if (typeof content === "bigint") {
        return content.toString();
    }
    else if (typeof content === "boolean") {
        return content ? "true" : "false";
    }
    else if (typeof content === "number") {
        return content.toString();
    }
    else if (typeof content === "string") {
        return renderText(content);
    }
    else if (isIterable(content)) {
        let result = "";
        for (const item of content) {
            result += render(item);
        }
        return result;
    }
    else if (content) {
        let result = "<" + content.type + renderAttributes(content.props) + ">";
        if (!(content.type in noEndTag)) {
            if (content.props) {
                result += render(content.props.children);
            }
            result += "</" + content.type + ">";
        }
        return result;
    }
    else {
        return "";
    }
}
