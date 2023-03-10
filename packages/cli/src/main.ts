#!/usr/bin/env node

import * as path from "path";
import * as process from "process";
import yargs, { Options } from "yargs";
import * as yargs_helpers from "yargs/helpers";
import makeExplorer from "./commands/interactive-site-generator.js";
import serveSite from "./commands/site-server.js";
import makeStaticSite from "./commands/static-site-generator.js";
import "./main.css";

const baseOption = {
    "base": {
        alias: "B",
        description: "Specify the base URL for generated pages",
        nargs: 1,
        type: "string"
    }
} satisfies { [key in string]: Options };

const outputOption = {
    "output": {
        alias: "o",
        description: "Specify the output directory for generated files",
        nargs: 1,
        type: "string",
        coerce: (arg: string) => path.resolve(arg),
    }
} satisfies { [key in string]: Options };

const projectOption = {
    "project": {
        description: "Specify the project file to use",
        nargs: 1,
        type: "string",
        default: "./rdf.json",
        coerce: (arg: string) => path.resolve(arg),
    }
} satisfies { [key in string]: Options };

yargs(yargs_helpers.hideBin(process.argv))
    .parserConfiguration({
        "boolean-negation": false,
        "parse-numbers": false,
        "sort-commands": true,
    })
    .scriptName("rdf")
    .usage("Usage: $0 <command> [options]")

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
                args => makeStaticSite(args))

            .help()
            .version(false)
            .demandCommand(1, 1)
            .strict())

    .command("serve [port]", "Serve a generated site",
        yargs => yargs
            .positional("port", { type: "number", default: 8000 }).nargs("port", 1)
            .option(baseOption)
            .help()
            .option(outputOption)
            .option(projectOption)
            .version(false)
            .strict(),
        args => serveSite(args.port, args))

    .help()
    .version(false)
    .demandCommand(1, 1)
    .strict()
    .parseSync();
