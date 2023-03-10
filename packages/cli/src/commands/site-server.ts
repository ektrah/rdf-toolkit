import * as fs from "fs";
import Koa, { Middleware } from "koa";
import send, { SendOptions } from "koa-send";
import * as readline from "node:readline";
import * as os from "os";
import * as path from "path";
import { ProjectConfig } from "../configuration.js";
import { Site } from "../site.js";

const DEFAULT_TITLE = "RDF Explorer";
const DEFAULT_OUTPUT = "./public/";
const DEFAULT_BASE = "https://example.com/";

function serve(opts?: SendOptions): Middleware<{}> {
    return async function serve(ctx, next) {
        if (ctx.method === "HEAD" || ctx.method === "GET") {
            try {
                return await send(ctx, ctx.path, opts);
            } catch (err) {
                if ((err as { status?: number }).status !== 404) {
                    throw err
                }
            }
        }

        return await next();
    }
}

function createBaseURL(s: string, port: number): string {
    const url = new URL(s, DEFAULT_BASE);
    url.protocol = "http";
    url.hostname = "localhost";
    url.port = port.toString();
    return url.href;
}

export default function main(port: number, args: { base: string | undefined, output: string | undefined, project: string }): void {
    const configFilePath = args.project;
    const configPath = path.dirname(configFilePath);
    const config = JSON.parse(fs.readFileSync(configFilePath, { encoding: "utf-8" }));

    if (!ProjectConfig.is(config)) {
        throw new Error("Invalid project file");
    }

    config.files ||= {};
    config.siteOptions ||= {};
    config.siteOptions.title ||= DEFAULT_TITLE;
    config.siteOptions.icons ||= [];
    config.siteOptions.assets ||= {};
    config.siteOptions.baseURL = createBaseURL(args.base || config.siteOptions.baseURL || DEFAULT_BASE, port);
    config.siteOptions.outDir = args.output || config.siteOptions.outDir || DEFAULT_OUTPUT;

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const site = new Site(configPath, config.siteOptions.outDir);
    const app = new Koa();

    app.use(serve({
        root: site.siteDirectoryPath,
        index: "index.html",
        gzip: false,
        brotli: false,
        extensions: [".html"],
    }));

    const server = app.listen(port);

    rl.question(`Serving "${site.siteDirectoryPath}" as <${config.siteOptions.baseURL}>${os.EOL}`, () => {
        server.close();
        rl.close();
    });
}
