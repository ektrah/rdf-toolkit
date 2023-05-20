import Koa, { Middleware } from "koa";
import send, { SendOptions } from "koa-send";
import * as os from "node:os";
import * as readline from "node:readline";
import { Project } from "../model/project.js";
import { ProjectOptions, ServerOptions } from "../options.js";
import { Workspace } from "../workspace.js";

type Options =
    & ProjectOptions
    & ServerOptions

function serve(opts: SendOptions): Middleware {
    return async function serve(ctx, next) {
        if (ctx.method === "HEAD" || ctx.method === "GET") {
            try {
                return await send(ctx, ctx.path, opts);
            } catch (err) {
                if ((err as { status?: number }).status !== 404) {
                    throw err;
                }
            }
        }

        return await next();
    }
}

export default function main(port: number, options: Options): void {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const project = new Project(options.project);
    const workspace = new Workspace(project.package.resolve(options.root || project.json.siteOptions?.outDir || "public"));

    const opts: SendOptions = {
        root: workspace.directoryPath,
        index: "index.html",
        gzip: false,
        brotli: false,
        extensions: [".html"],
    };

    const server = new Koa().use(serve(opts)).listen(port);

    rl.question(`Serving "${workspace.directoryPath}" as <http://localhost:${port}/>${os.EOL}`, () => {
        server.close();
        rl.close();
    });
}
