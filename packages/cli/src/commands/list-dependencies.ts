import * as os from "node:os";
import * as process from "node:process";
import { Package } from "../model/package.js";
import { Project } from "../model/project.js";
import { ProjectOptions } from "../options.js";

type Options =
    & ProjectOptions

const stack: Array<string> = [];

function printDependencies(package_: Package, indentation: string): void {
    const dependencies = Array.from(package_.dependencies)
        .filter(([x]) => !stack.includes(x))
        .sort();

    for (let i = 0; i < dependencies.length; i++) {
        const [moduleName, package_] = dependencies[i];

        process.stdout.write(indentation);
        process.stdout.write(i + 1 < dependencies.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C ");
        process.stdout.write(moduleName);

        if (package_) {
            if (package_.version) {
                process.stdout.write("@");
                process.stdout.write(package_.version);
            }
            process.stdout.write(os.EOL);

            stack.push(moduleName);
            printDependencies(package_, indentation + (i + 1 < dependencies.length ? "  \u2502" : "   "));
            stack.pop();
        }
        else {
            process.stdout.write(" \u00D7");
            process.stdout.write(os.EOL);
        }
    }
}

export default function main(options: Options): void {
    const project = new Project(options.project);

    if (project.package.dependencies.size) {
        process.stdout.write("  \u2564");
        process.stdout.write(os.EOL);

        printDependencies(project.package, "");
    }
}
