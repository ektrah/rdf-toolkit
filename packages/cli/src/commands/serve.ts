import * as readline from "node:readline";
import * as os from "os";
import { Project } from "../project.js";
import { Site } from "../site.js";

export default function main(port: number, args: { root: string | undefined, project: string }): void {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const project = Project.from(args.project);
    const site = new Site(project, args.root);
    const server = site.serve(port);

    rl.question(`Serving "${site.directoryPath}" as <http://localhost:${port}/>${os.EOL}`, () => {
        server.close();
        rl.close();
    });
}
