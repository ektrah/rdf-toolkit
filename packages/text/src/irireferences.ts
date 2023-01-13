export interface IRIReference {
    readonly scheme?: string;
    readonly authority?: string;
    readonly path: string;
    readonly query?: string;
    readonly fragment?: string;
}

export namespace IRIReference {

    export function parse(s: string): IRIReference | null {
        //          12            3    4          5       6  7        8 9
        const m = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/u.exec(s);
        return m ? { scheme: m[2], authority: m[4], path: m[5], query: m[7], fragment: m[9], } : null;
    }

    export function resolve(R: IRIReference, Base: IRIReference): IRIReference {
        let scheme: string | undefined;
        let authority: string | undefined;
        let path: string;
        let query: string | undefined;

        if (typeof R.scheme === "string") {
            scheme = R.scheme;
            authority = R.authority;
            path = removeDotSegments(R.path);
            query = R.query;
        } else {
            if (typeof R.authority === "string") {
                authority = R.authority;
                path = removeDotSegments(R.path);
                query = R.query;
            } else {
                if (R.path == "") {
                    path = Base.path;
                    if (typeof R.query === "string") {
                        query = R.query;
                    } else {
                        query = Base.query;
                    }
                } else {
                    if (R.path.startsWith("/")) {
                        path = removeDotSegments(R.path);
                    } else {
                        path = mergePaths(Base, R.path);
                        path = removeDotSegments(path);
                    }
                    query = R.query;
                }
                authority = Base.authority;
            }
            scheme = Base.scheme;
        }

        return { scheme, authority, path, query, fragment: R.fragment };
    }

    export function recompose(R: IRIReference): string {
        let result = "";
        if (typeof R.scheme === "string") {
            result += R.scheme;
            result += ":";
        }
        if (typeof R.authority === "string") {
            result += "//";
            result += R.authority;
        }
        result += R.path;
        if (typeof R.query === "string") {
            result += "?";
            result += R.query;
        }
        if (typeof R.fragment === "string") {
            result += "#";
            result += R.fragment;
        }
        return result;
    }
}

function mergePaths(base: IRIReference, relativePath: string): string {
    if (base.authority && base.path === "") {
        return "/" + relativePath;
    }
    else {
        const pos = base.path.lastIndexOf("/");
        return (pos >= 0) ? base.path.substr(0, pos) + relativePath : relativePath;
    }
}

function removeDotSegments(input: string): string {
    let output = "";

    while (input.length > 0) {
        if (input.startsWith("../")) {
            input = input.substr(3);
        }
        else if (input.startsWith("./") || input.startsWith("/./")) {
            input = input.substr(2);
        }
        else if (input === "/.") {
            input = "/";
        }
        else if (input.startsWith("/../")) {
            input = input.substr(3);
            const pos = output.lastIndexOf("/");
            output = (pos >= 0) ? output.substring(0, pos) : "";
        }
        else if (input === "/..") {
            input = "/";
            const pos = output.lastIndexOf("/");
            output = (pos >= 0) ? output.substring(0, pos) : "";
        }
        else if (input === "." || input === "..") {
            input = "";
        }
        else {
            const q = input.indexOf("/", input.startsWith("/") ? 1 : 0);
            output += (q >= 0) ? input.substr(0, q) : input;
            input = (q >= 0) ? input.substr(q) : "";
        }
    }

    return output;
}
