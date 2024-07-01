import { HtmlAttributes, HtmlContent, HtmlElement } from "./html.js";

declare global {

    namespace JSX {

        interface Element extends HtmlElement {
        }

        interface ElementClass {
            render(): HtmlContent;
        }

        interface ElementAttributesProperty {
            props: any;
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
                crossorigin?: CORSSettings;
                rel?: string;
                media?: string;
                integrity?: string;
                hreflang?: string;
                type?: string;
                referrerpolicy?: ReferrerPolicy;
                sizes?: string;
                imagesrcset?: string;
                imagesizes?: string;
                "as"?: PotentialDestination;
                blocking?: Array<BlockingToken>;
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
                blocking?: Array<BlockingToken>;
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
                type?: MarkerKind;
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
                referrerpolicy?: ReferrerPolicy;
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

            data: GlobalAttributes & {
                value: string;
            };

            time: GlobalAttributes & {
                datetime?: string;
            };

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

            ins: GlobalAttributes & {
                cite?: string;
                datetime?: string;
            };

            del: GlobalAttributes & {
                cite?: string;
                datetime?: string;
            };

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
                crossorigin?: CORSSettings;
                usemap?: string;
                ismap?: boolean;
                width?: number;
                height?: number;
                referrerpolicy?: ReferrerPolicy;
                decoding?: ImageDecodingHint;
                loading?: LazyLoading;
            };

            iframe: GlobalAttributes & {
                src?: string;
                srcdoc?: string;
                name?: string;
                sandbox?: Array<SandboxKeyword>;
                allow?: string;
                allowfullscreen?: boolean;
                width?: string;
                height?: string;
                referrerpolicy?: ReferrerPolicy;
                loading?: LazyLoading;
            };

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
                autocomplete?: "off" | Array<string>;
                checked?: boolean;
                //dirname
                disabled?: boolean;
                //form
                //formaction
                //formenctype
                //formmethod
                //formnovalidate
                //formtarget
                //height
                //list
                //max
                maxlength?: number;
                //min
                minlength?: number;
                multiple?: boolean;
                name?: string;
                pattern?: string;
                placeholder?: string;
                readonly?: boolean;
                required?: boolean;
                size?: number;
                //src
                //step
                type?: InputType;
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

            script: GlobalAttributes & {
                src?: string;
                type?: string;
                nomodule?: boolean;
                async?: boolean;
                defer?: boolean;
                crossorigin?: CORSSettings;
                integrity?: string;
                referrerpolicy?: ReferrerPolicy;
                blocking?: Array<BlockingToken>;
            };

            noscript: GlobalAttributes;

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
            dir?: TextDirectionality;
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

            class?: string | null | Array<string | null>;
            id?: string;
            //slot
        }

        //
        // 2.2.5. Requests
        //

        type Destination =
            | "audio"
            | "audioworklet"
            | "document"
            | "embed"
            | "font"
            | "frame"
            | "iframe"
            | "image"
            | "manifest"
            | "object"
            | "paintworklet"
            | "report"
            | "script"
            | "serviceworker"
            | "sharedworker"
            | "style"
            | "track"
            | "video"
            | "webidentity"
            | "worker"
            | "xslt"

        //
        // 2.2.7. Miscellaneous
        //

        type PotentialDestination =
            | "fetch"
            | Destination

        //
        // 2.5.4 CORS settings attributes
        //

        type CORSSettings =
            | ""
            | "anonymous"
            | "use-credentials"

        //
        // 2.5.5 Referrer policy attributes
        //

        type ReferrerPolicy =
            | ""
            | "no-referrer"
            | "no-referrer-when-downgrade"
            | "same-origin"
            | "origin"
            | "strict-origin"
            | "origin-when-cross-origin"
            | "strict-origin-when-cross-origin"
            | "unsafe-url"

        //
        // 2.5.7 Lazy loading attributes
        //

        type LazyLoading =
            | "lazy"
            | "eager"

        //
        // 2.5.8 Blocking attributes
        //

        type BlockingToken =
            | "render"

        //
        // 3.2.6.4 The dir attribute
        //

        type TextDirectionality =
            | "ltr"
            | "rtl"
            | "auto"

        //
        // 4.4.5 The ol element
        //

        type MarkerKind =
            | "1"
            | "a"
            | "A"
            | "i"
            | "I"

        //
        // 4.8.4.3.4 Decoding images
        //

        type ImageDecodingHint =
            | "sync"
            | "async"
            | "auto"

        //
        // 4.8.5 The iframe element
        //

        type SandboxKeyword =
            | "allow-downloads"
            | "allow-forms"
            | "allow-modals"
            | "allow-orientation-lock"
            | "allow-pointer-lock"
            | "allow-popups"
            | "allow-popups-to-escape-sandbox"
            | "allow-presentation"
            | "allow-same-origin"
            | "allow-scripts"
            | "allow-top-navigation"
            | "allow-top-navigation-by-user-activation"
            | "allow-top-navigation-to-custom-protocols"

        //
        // 4.10.5 The input element
        //

        type InputType =
            | "hidden"
            | "text"
            | "search"
            | "tel"
            | "url"
            | "email"
            | "password"
            | "date"
            | "month"
            | "week"
            | "time"
            | "datetime-local"
            | "number"
            | "range"
            | "color"
            | "checkbox"
            | "radio"
            | "file"
            | "submit"
            | "image"
            | "reset"
            | "button"
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
