import * as path from "node:path";
import * as yargs from "yargs";

export type DiagnosticOptions = {
    readonly noWarn: boolean | undefined;
    readonly warnAsError: boolean | undefined;
}

export type ForceOptions = {
    readonly force: boolean | undefined;
}

export type MakeOptions = {
    readonly output: string | undefined;
}

export type ProjectOptions = {
    readonly project: string;
}

export type RecursiveOptions = {
    readonly recursive: boolean | undefined;
}

export type ServerOptions = {
    readonly root: string | undefined;
}

export type SiteOptions = {
    readonly base: string | undefined;
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

    export const force = {
        "force": {
            description: "Force overwriting existing files",
            nargs: 0,
            type: "boolean"
        }
    } satisfies Record<string, yargs.Options>;

    export const noWarnings = {
        "no-warn": {
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
            alias: "p",
            description: "Specify the project file",
            nargs: 1,
            type: "string",
            default: ".",
            coerce: (arg: string) => path.resolve(arg),
        }
    } satisfies Record<string, yargs.Options>;

    export const recursive = {
        "recursive": {
            alias: "r",
            description: "List items recursively",
            nargs: 0,
            type: "boolean"
        }
    } satisfies Record<string, yargs.Options>;

    export const root = {
        "root": {
            description: "Specify the root directory",
            nargs: 1,
            type: "string",
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
