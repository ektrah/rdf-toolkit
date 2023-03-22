import * as path from "path";
import * as yargs from "yargs";

export type DiagnosticOptions = {
    readonly warningAsError?: boolean;
    readonly suppressWarnings?: boolean;
}

export type MakeOptions = {
    readonly output?: string;
}

export type ProjectOptions = {
    readonly project: string;
}

export namespace Options {

    export const base = {
        "base": {
            alias: "B",
            description: "Specify the base URL for generated pages",
            nargs: 1,
            type: "string"
        }
    } satisfies Record<string, yargs.Options>;

    export const noWarnings = {
        "no-warnings": {
            description: "Suppress all warnings",
            nargs: 0,
            type: "boolean"
        }
    } satisfies Record<string, yargs.Options>;

    export const output = {
        "output": {
            alias: "o",
            description: "Specify the output directory for generated files",
            nargs: 1,
            type: "string",
            coerce: (arg: string) => path.resolve(arg),
        }
    } satisfies Record<string, yargs.Options>;

    export const project = {
        "project": {
            description: "Specify the project file",
            nargs: 1,
            type: "string",
            default: "./rdf.json",
            coerce: (arg: string) => path.resolve(arg),
        }
    } satisfies Record<string, yargs.Options>;

    export const warnAsError = {
        "warn-as-error": {
            alias: "W",
            description: "Treat all warnings as errors",
            nargs: 0,
            type: "boolean"
        }
    } satisfies Record<string, yargs.Options>;
}
