import { HtmlAttributes, HtmlContent, HtmlElement } from "./html.js";

declare global {

    namespace JSX {

        interface Element extends HtmlElement {
        }

        interface ElementClass {
            render(): HtmlContent;
        }

        interface ElementAttributesProperty {
            props: {};
        }

        interface ElementChildrenAttribute {
            children: HtmlContent;
        }

        interface IntrinsicAttributes {
        }

        interface IntrinsicClassAttributes<T> {
        }

        interface IntrinsicElements {

            //
            // 4.1 The document element
            //

            html: GlobalAttributes;

            //
            // 4.2 Document metadata
            //

            head: GlobalAttributes;

            title: GlobalAttributes;

            base: GlobalAttributes & {
                href?: string;
                target?: string;
            };

            link: GlobalAttributes & {
                href?: string;
                crossorigin?: "anonymous" | "use-credentials";
                rel?: string;
                media?: string;
                integrity?: string;
                hreflang?: string;
                type?: string;
                referrerpolicy?: "" | "no-referrer" | "no-referrer-when-downgrade" | "same-origin" | "origin" | "strict-origin" | "origin-when-cross-origin" | "strict-origin-when-cross-origin" | "unsafe-url";
                sizes?: string;
                imagesrcset?: string;
                imagesizes?: string;
                "as"?: string;
                blocking?: "render";
                color?: string;
                disabled?: boolean;
            };

            meta: GlobalAttributes & {
                name?: string;
                "http-equiv"?: string;
                content?: string;
                charset?: string;
                media?: string;
            };

            style: GlobalAttributes & {
                media?: string;
                blocking?: "render";
            };

            //
            // 4.3 Sections
            //

            body: GlobalAttributes;

            article: GlobalAttributes;

            section: GlobalAttributes;

            nav: GlobalAttributes;

            aside: GlobalAttributes;

            h1: GlobalAttributes;
            h2: GlobalAttributes;
            h3: GlobalAttributes;
            h4: GlobalAttributes;
            h5: GlobalAttributes;
            h6: GlobalAttributes;

            hgroup: GlobalAttributes;

            header: GlobalAttributes;

            footer: GlobalAttributes;

            address: GlobalAttributes;

            //
            // 4.4 Grouping content
            //

            p: GlobalAttributes;

            hr: GlobalAttributes;

            pre: GlobalAttributes;

            blockquote: GlobalAttributes & {
                cite?: string;
            };

            ol: GlobalAttributes & {
                reversed?: boolean;
                start?: number;
                type?: "1" | "a" | "A" | "i" | "I";
            };

            ul: GlobalAttributes;

            menu: GlobalAttributes;

            li: GlobalAttributes & {
                value?: number;
            };

            dl: GlobalAttributes;

            dt: GlobalAttributes;

            dd: GlobalAttributes;

            figure: GlobalAttributes;

            figcaption: GlobalAttributes;

            main: GlobalAttributes;

            div: GlobalAttributes;

            //
            // 4.5 Text-level semantics
            //

            a: GlobalAttributes & {
                href?: string;
                target?: string;
                download?: string;
                ping?: string;
                rel?: string;
                hreflang?: string;
                type?: string;
                referrerpolicy?: "" | "no-referrer" | "no-referrer-when-downgrade" | "same-origin" | "origin" | "strict-origin" | "origin-when-cross-origin" | "strict-origin-when-cross-origin" | "unsafe-url";
            }

            em: GlobalAttributes;

            strong: GlobalAttributes;

            small: GlobalAttributes;

            s: GlobalAttributes;

            cite: GlobalAttributes;

            q: GlobalAttributes & {
                cite?: string;
            };

            dfn: GlobalAttributes;

            abbr: GlobalAttributes;

            //ruby
            //rt
            //rp
            //data
            //time

            code: GlobalAttributes;

            var: GlobalAttributes;

            samp: GlobalAttributes;

            kbd: GlobalAttributes;

            sub: GlobalAttributes;
            sup: GlobalAttributes;

            i: GlobalAttributes;

            b: GlobalAttributes;

            u: GlobalAttributes;

            mark: GlobalAttributes;

            bdi: GlobalAttributes;

            bdo: GlobalAttributes;

            span: GlobalAttributes;

            br: GlobalAttributes;

            wbr: GlobalAttributes;

            //
            // 4.7 Edits
            //

            //ins
            //del

            //
            // 4.8 Embedded content
            //

            //picture
            //source

            img: GlobalAttributes & {
                alt?: string;
                src: string;
                srcset?: string;
                sizes?: string;
                crossorigin?: string;
                usemap?: string;
                ismap?: boolean;
                width?: number;
                height?: number;
                referrerpolicy?: string;
                decoding?: string;
                loading?: string;
            };

            //iframe
            //embed
            //object
            //video
            //audio
            //track

            //
            // 4.9 Tabular data
            //

            table: GlobalAttributes;

            caption: GlobalAttributes;

            //colgroup
            //col

            tbody: GlobalAttributes;

            thead: GlobalAttributes;

            tfoot: GlobalAttributes;

            tr: GlobalAttributes;

            td: GlobalAttributes & {
                colspan?: number;
                rowspan?: number;
                headers?: string;
            };

            th: GlobalAttributes & {
                colspan?: number;
                rowspan?: number;
                headers?: string;
                scope?: string;
                abbr?: string;
            };

            //
            // 4.10 Forms
            //

            //form

            label: GlobalAttributes & {
                for?: string;
            };

            input: GlobalAttributes & {
                //accept
                //alt
                //autocomplete
                checked?: boolean;
                //dirname
                //disabled
                //form
                //formaction
                //formenctype
                //formmethod
                //formnovalidate
                //formtarget
                //height
                //list
                //max
                //maxlength
                //min
                //minlength
                //multiple
                name?: string;
                //pattern
                //placeholder
                //readonly
                //required
                //size
                //src
                //step
                type?: "hidden" | "text" | "search" | "tel" | "url" | "email" | "password" | "date" | "month" | "week" | "time" | "datetime-local" | "number" | "range" | "color" | "checkbox" | "radio" | "file" | "submit" | "image" | "reset" | "button";
                //value
                //width
            };

            //button
            //select
            //datalist
            //optgroup
            //option
            //textarea
            //output
            //progress
            //meter
            //fieldset
            //legend

            //
            // 4.11 Interactive elements
            //

            details: GlobalAttributes & {
                open?: boolean;
            };

            summary: GlobalAttributes;

            //dialog

            //
            // 4.12 Scripting
            //

            //script
            //noscript
            //template
            //slot
            //canvas
        }

        interface GlobalAttributes {
            readonly children?: HtmlContent;

            //
            // 3.2.6 Global attributes
            //

            //accesskey
            //autocapitalize
            //autofocus
            //contenteditable
            dir?: "ltr" | "rtl" | "auto";
            //draggable
            //enterkeyhint
            //hidden
            //inert
            //inputmode
            //is
            //itemid
            //itemprop
            //itemref
            //itemscope
            //itemtype
            lang?: string;
            //nonce
            //spellcheck
            //style
            //tabindex
            title?: string;
            //translate

            class?: string | null | (string | null)[];
            id?: string;
            //slot
        }
    }
}

const Fragment = null;

function jsx(type: string | any, props: HtmlAttributes): HtmlContent {
    if (typeof type === "function") {
        if (typeof type.prototype !== "undefined") {
            return new type(props).render();
        }
        return type(props);
    }
    else {
        return type ? { type, props } : props.children;
    }
}

export { jsx, jsx as jsxs, Fragment };
