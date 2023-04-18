import * as os from "node:os";
import * as process from "node:process";
import { Package } from "../model/package.js";
import { Project } from "../model/project.js";
import { AllOption, ProjectOptions, RecursiveOptions } from "../options.js";

type Options =
    & AllOption
    & ProjectOptions
    & RecursiveOptions

const stack: Array<string> = [];

function printPackages(packages: Array<readonly [string, Package | null]>, indentation: string, recursive: boolean): void {
    for (let i = 0; i < packages.length; i++) {
        const [moduleName, package_] = packages[i];

        process.stdout.write(indentation);
        process.stdout.write(i + 1 < packages.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C ");
        process.stdout.write(moduleName);

        if (package_) {
            if (package_.version) {
                process.stdout.write("@");
                process.stdout.write(package_.version);
            }
            process.stdout.write(os.EOL);

            if (recursive) {
                const dependencies = Array.from(package_.dependencies)
                    .filter(([x]) => !stack.includes(x))
                    .sort();

                stack.push(moduleName);
                printPackages(dependencies, indentation + (i + 1 < packages.length ? "  \u2502" : "   "), recursive);
                stack.pop();
            }
        }
        else {
            process.stdout.write(" \u00D7");
            process.stdout.write(os.EOL);
        }
    }
}

export default function main(options: Options): void {
    const project = new Project(options.project);

    const packages = !!options.all
        ? Array.from(project.packages).filter(([, p]) => p !== project.package).sort()
        : Array.from(project.package.dependencies).sort();

    if (packages.length) {
        process.stdout.write("  \u2564");
        process.stdout.write(os.EOL);

        printPackages(packages, "", !!options.recursive);
    }
}
