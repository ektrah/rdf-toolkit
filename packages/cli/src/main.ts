#!/usr/bin/env node

import * as path from "path";
import * as process from "process";
import yargs, { Options } from "yargs";
import * as yargs_helpers from "yargs/helpers";
import addFile from "./commands/add-file.js";
import makeExplorer from "./commands/make-explorer.js";
import makeSite from "./commands/make-site.js";
import removeFile from "./commands/remove-file.js";
import serve from "./commands/serve.js";
import "./main.css";

const baseOption = {
    "base": {
        alias: "B",
        description: "Specify the base URL for generated pages",
        nargs: 1,
        type: "string"
    }
} satisfies Record<string, Options>;

const outputOption = {
    "output": {
        alias: "o",
        description: "Specify the output directory for generated files",
        nargs: 1,
        type: "string",
        coerce: (arg: string) => path.resolve(arg),
    }
} satisfies Record<string, Options>;

const projectOption = {
    "project": {
        description: "Specify the project file",
        nargs: 1,
        type: "string",
        default: "./rdf.json",
        coerce: (arg: string) => path.resolve(arg),
    }
} satisfies Record<string, Options>;

yargs(yargs_helpers.hideBin(process.argv))
    .parserConfiguration({
        "boolean-negation": false,
        "parse-numbers": false,
        "sort-commands": true,
    })
    .scriptName("rdf")
    .usage("Usage: $0 <command> [options]")

    .command("add <type>", "Add the specified item",
        yargs => yargs

            .command("file <uri> <path>", "Add a file to the project",
                yargs => yargs
                    .positional("uri", { type: "string", coerce: (arg: string) => new URL(arg).href, description: "The URI of the file to add" }).demandOption("uri")
                    .positional("path", { type: "string", coerce: (arg: string) => path.resolve(arg), description: "The local path of the file to add" }).demandOption("path")
                    .help()
                    .option(projectOption)
                    .version(false)
                    .example("$0 add file http://www.w3.org/2002/07/owl ./vocab/owl.ttl", "")
                    .strict(),
                args => addFile(args.uri, args.path, args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("remove <type>", "Remove the specified item",
        yargs => yargs

            .command("file <uri>", "Remove a file from the project",
                yargs => yargs
                    .positional("uri", { type: "string", coerce: (arg: string) => new URL(arg).href, description: "The URI of the file to remove" }).demandOption("uri")
                    .help()
                    .option(projectOption)
                    .version(false)
                    .example("$0 remove file http://www.w3.org/2002/07/owl", "")
                    .strict(),
                args => removeFile(args.uri, args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("make <target>", "Generate the specified target",
        yargs => yargs

            .command("explorer", "Generate an interactive explorer",
                yargs => yargs
                    .option(baseOption)
                    .help()
                    .option(outputOption)
                    .option(projectOption)
                    .version(false)
                    .strict(),
                args => makeExplorer(args))

            .command("site", "Generate a static website",
                yargs => yargs
                    .option(baseOption)
                    .help()
                    .option(outputOption)
                    .option(projectOption)
                    .version(false)
                    .strict(),
                args => makeSite(args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("serve [port]", "Serve a generated site",
        yargs => yargs
            .positional("port", { type: "number", default: 8000 }).nargs("port", 1)
            .help()
            .option("root", { type: "string", coerce: (arg: string) => path.resolve(arg), description: "Root directory" })
            .option(projectOption)
            .version(false)
            .example("$0 serve 8080", "")
            .strict(),
        args => serve(args.port, args))

    .help()
    .version(false)
    .demandCommand(1, 1)
    .strict()
    .parseSync();
