import * as os from "os";
import * as process from "process";
import { DocumentUri } from "vscode-languageserver-textdocument";
import { ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & ProjectOptions

export default function main(documentURI: DocumentUri, options: Options): void {
    const project = Project.from(options.project);
    if (project.config.files && documentURI in project.config.files) {
        delete project.config.files[documentURI];
        project.saveConfig();
        process.stdout.write(`<${documentURI}> \u2717${os.EOL}`);
    }
}
