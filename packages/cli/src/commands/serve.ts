import Koa, { Middleware } from "koa";
import send, { SendOptions } from "koa-send";
import * as readline from "node:readline";
import * as os from "os";
import { Project } from "../project.js";
import { Site } from "../site.js";

function serve(opts: SendOptions): Middleware<{}> {
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

export default function main(port: number, args: { root: string | undefined, project: string }): void {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const project = new Project(args.project).load();
    const site = new Site(project, args.root);
    const server = new Koa().use(serve(site.config)).listen(port);

    rl.question(`Serving "${site.siteDirectoryPath}" as <http://localhost:${port}/>${os.EOL}`, () => {
        server.close();
        rl.close();
    });
}
