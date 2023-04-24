import { DocumentUri } from "@rdf-toolkit/text";
import * as fs from "node:fs";
import { Is } from "../type-checks.js";
import { Workspace } from "../workspace.js";
import { Project } from "./project.js";
import { TextFile } from "./textfile.js";

export const PACKAGE_JSON = "package.json";

export interface PackageConfig {
    name?: unknown; // string
    version?: unknown; // string
    description?: unknown; // string
    keywords?: unknown; // Array<string>
    homepage?: unknown; // string
    bugs?: unknown; // Bugs
    license?: unknown; // string
    author?: unknown; // PersonConfig
    contributors?: unknown; // Array<PersonConfig>
    maintainers?: unknown; // Array<PersonConfig>
    repository?: unknown; // RepositoryConfig
    dependencies?: unknown; // Record<string, string>
    devDependencies?: unknown; // Record<string, string>

    ontologies?: unknown, // Record<DocumentUri, string>
    roots?: unknown, //Array<string>
}

export class Package extends Workspace {
    private _dependencies?: ReadonlyMap<string, Package | null>;
    private _files?: ReadonlyMap<DocumentUri, TextFile | null>;
    private _json?: PackageConfig;
    private _roots?: ReadonlySet<string>;

    constructor(packagePath: string, readonly containingProject: Project) {
        super(packagePath);
    }

    get dependencies(): ReadonlyMap<string, Package | null> {
        return this._dependencies ??= getDependencies(this.json, this.containingProject);
    }

    get json(): PackageConfig {
        return this._json ??= getPackageConfig(this);
    }

    get files(): ReadonlyMap<DocumentUri, TextFile | null> {
        return this._files ??= getFiles(this.json, this);
    }

    get version(): string | undefined {
        return Is.string(this.json.version) ? this.json.version : undefined;
    }

    get roots(): ReadonlySet<string> {
        return this._roots ??= getRoots(this.json);
    }
}

function getRoots(json: PackageConfig): ReadonlySet<string> {
    const rootIRIs = new Set<string>();
    if(Array.isArray(json.roots)) {
        json.roots.forEach( (r) => {
            rootIRIs.add(r);
        } );
    }
    return rootIRIs;
}
function getDependencies(json: PackageConfig, containingProject: Project): Map<string, Package | null> {
    const dependencies = new Map<string, Package | null>();

    if (Is.objectLiteral(json.dependencies)) {
        for (const packageName in json.dependencies) {
            dependencies.set(packageName, containingProject.resolvePackage(packageName));
        }
    }

    return dependencies;
}

function getFiles(json: PackageConfig, containingPackage: Package): Map<DocumentUri, TextFile | null> {
    const files = new Map<DocumentUri, TextFile | null>();

    if (Is.record(json.ontologies, Is.string)) {
        for (const documentURI in json.ontologies) {
            const filePath = containingPackage.resolve(json.ontologies[documentURI]);

            let file: TextFile | null = null;
            if (fs.existsSync(filePath)) {
                file = new TextFile(documentURI, fs.realpathSync(filePath), containingPackage);
            }
            files.set(documentURI, file);
        }
    }

    return files;
}

function getPackageConfig(workspace: Workspace): PackageConfig {
    const value = workspace.readJSON(PACKAGE_JSON);
    if (!Is.objectLiteral(value)) {
        throw new Error("Invalid " + PACKAGE_JSON);
    }
    return value;
}
