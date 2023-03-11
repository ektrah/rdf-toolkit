import * as fs from "fs";
import { SendOptions } from "koa-send";
import * as os from "os";
import * as path from "path";
import prettyBytes from "pretty-bytes";
import * as process from "process";
import { Project } from "./project.js";

export class Site {
    readonly config: Readonly<SendOptions>;
    readonly siteDirectoryPath: string;

    constructor(private readonly project: Project, siteDirectoryPath?: string) {
        this.siteDirectoryPath = project.resolve(siteDirectoryPath || project.config.siteOptions?.outDir || "./public/");

        this.config = {
            root: this.siteDirectoryPath,
            index: "index.html",
            gzip: false,
            brotli: false,
            extensions: [".html"],
        };
    }

    readFile(filePath: string): Buffer {
        filePath = path.resolve(this.siteDirectoryPath, filePath);
        return fs.readFileSync(filePath);
    }

    writeFile(filePath: string, data: Buffer): void {
        filePath = path.resolve(this.siteDirectoryPath, filePath);
        process.stderr.write(`${this.project.relative(filePath)} (${prettyBytes(data.length)})${os.EOL}`);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, data);
    }
}
