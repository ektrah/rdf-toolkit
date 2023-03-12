import { Server } from "http";
import Koa, { Middleware } from "koa";
import send, { SendOptions } from "koa-send";
import { Project } from "./project.js";
import { Workspace } from "./workspace.js";

function serve(opts: SendOptions): Middleware<{}> {
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

export class Site extends Workspace {
    constructor(project: Project, siteDirectoryPath?: string) {
        super(project.resolve(siteDirectoryPath || project.config.siteOptions?.outDir || "./public/"));
    }

    serve(port: number): Server {
        const opts: SendOptions = {
            root: this.directoryPath,
            index: "index.html",
            gzip: false,
            brotli: false,
            extensions: [".html"],
        };

        return new Koa().use(serve(opts)).listen(port);
    }
}
