#!/usr/bin/env node

import { DocumentUri } from "@rdf-toolkit/text";
import * as path from "node:path";
import * as process from "node:process";
import yargs from "yargs";
import * as yargs_helpers from "yargs/helpers";
import addFile from "./commands/add-file.js";
import init from "./commands/init.js";
import listDependencies from "./commands/list-dependencies.js";
import listFiles from "./commands/list-files.js";
import listImports from "./commands/list-imports.js";
import makeExplorer from "./commands/make-explorer.js";
import makeSite from "./commands/make-site.js";
import removeFile from "./commands/remove-file.js";
import serve from "./commands/serve.js";
import "./main.css";
import { Options } from "./options.js";

yargs(yargs_helpers.hideBin(process.argv))
    .parserConfiguration({
        "boolean-negation": false,
        "parse-numbers": false,
        "sort-commands": true,
    })
    .scriptName("rdf")
    .usage("Usage: $0 <command> [options]")

    .command("init", "Initialize a new project",
        yargs => yargs
            .help()
            .option(Options.force)
            .option(Options.project)
            .version(false)
            .strict(),
        args => init(args))

    .command("add <type>", "Add an item of the specified type",
        yargs => yargs

            .command("file <URL> <file>", "Add a Turtle file to the project",
                yargs => yargs
                    .positional("URL", {
                        type: "string",
                        coerce: (arg: string): DocumentUri => { const url = new URL(arg); url.hash = ""; return url.href; },
                        description: "The URL of the Turtle file to add",
                    })
                    .positional("file", {
                        type: "string",
                        coerce: (arg: string): string => path.resolve(arg),
                        description: "The local path of the Turtle file to add",
                    })
                    .help()
                    .option(Options.noWarnings)
                    .option(Options.project)
                    .option(Options.warnAsError)
                    .version(false)
                    .example("$0 add file \"http://www.w3.org/1999/02/22-rdf-syntax-ns\" vocab/rdf.ttl", "")
                    .example("$0 add file \"http://www.w3.org/2000/01/rdf-schema\" vocab/rdfs.ttl", "")
                    .example("$0 add file \"http://www.w3.org/2002/07/owl\" vocab/owl.ttl", "")
                    .example("$0 add file \"http://www.w3.org/ns/shacl\" vocab/shacl.ttl", "")
                    .demandOption("URL")
                    .demandOption("file")
                    .strict(),
                args => addFile(args.URL, args.file, args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("remove <type>", "Remove an item of the specified type",
        yargs => yargs

            .command("file <URL>", "Remove a Turtle file from the project",
                yargs => yargs
                    .positional("URL", {
                        type: "string",
                        coerce: (arg: string): DocumentUri => { const url = new URL(arg); url.hash = ""; return url.href; },
                        description: "The URI of the Turtle file to remove",
                    })
                    .help()
                    .option(Options.project)
                    .version(false)
                    .example("$0 remove file \"http://www.w3.org/2002/07/owl\"", "")
                    .demandOption("URL")
                    .strict(),
                args => removeFile(args.URL, args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("list <type>", "List all items of the specified type",
        yargs => yargs

            .command("dependencies", "List all dependencies of the project",
                yargs => yargs
                    .help()
                    .option(Options.project)
                    .version(false)
                    .example("$0 list dependencies", "")
                    .strict(),
                args => listDependencies(args))

            .command("files", "List all files in the project",
                yargs => yargs
                    .help()
                    .option(Options.project)
                    .version(false)
                    .example("$0 list files", "")
                    .strict(),
                args => listFiles(args))

            .command("imports", "List all OWL imports in the project",
                yargs => yargs
                    .help()
                    .option(Options.noWarnings)
                    .option(Options.project)
                    .option(Options.warnAsError)
                    .version(false)
                    .example("$0 list imports", "")
                    .strict(),
                args => listImports(args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("make <target>", "Generate the specified target",
        yargs => yargs

            .command("explorer", "Generate an interactive explorer",
                yargs => yargs
                    .help()
                    .option(Options.output)
                    .option(Options.project)
                    .version(false)
                    .strict(),
                args => makeExplorer(args))

            .command("site", "Generate a static website",
                yargs => yargs
                    .option(Options.base)
                    .help()
                    .option(Options.noWarnings)
                    .option(Options.output)
                    .option(Options.project)
                    .option(Options.warnAsError)
                    .version(false)
                    .strict(),
                args => makeSite(args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("serve [port]", "Serve a generated site",
        yargs => yargs
            .positional("port", {
                type: "number",
                default: 8000
            }).nargs("port", 1)
            .help()
            .option(Options.project)
            .option(Options.root)
            .version(false)
            .example("$0 serve 8000", "")
            .strict(),
        args => serve(args.port, args))

    .help()
    .version(false)
    .demandCommand(1, 1)
    .example("$0 init", "")
    .example("$0 add file \"http://www.w3.org/1999/02/22-rdf-syntax-ns\" vocab/rdf.ttl", "")
    .example("$0 add file \"http://www.w3.org/2000/01/rdf-schema\" vocab/rdfs.ttl", "")
    .example("$0 make explorer", "")
    .example("$0 serve", "")
    .strict()
    .parseSync();
