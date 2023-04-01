import * as readline from "node:readline";
import * as os from "os";
import { ProjectOptions, ServerOptions } from "../options.js";
import { Project } from "../project.js";
import { Site } from "../site.js";

type Options =
    & ProjectOptions
    & ServerOptions

export default function main(port: number, options: Options): void {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const project = Project.from(options.project);
    const site = new Site(project, options.root);
    const server = site.serve(port);

    rl.question(`Serving "${site.directoryPath}" as <http://localhost:${port}/>${os.EOL}`, () => {
        server.close();
        rl.close();
    });
}
