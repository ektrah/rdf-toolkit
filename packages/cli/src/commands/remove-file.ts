import { DocumentUri } from "@rdf-toolkit/text";
import * as os from "os";
import * as process from "process";
import { ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & ProjectOptions

export default function main(documentURI: DocumentUri, options: Options): void {
    const project = Project.from(options.project);

    if (project.removeFile(documentURI)) {
        project.saveConfig();
        process.stdout.write(`<${documentURI}> \u2717${os.EOL}`);
    }
}
