import { DocumentUri } from "@rdf-toolkit/text";
import * as fs from "node:fs";
import * as module from "node:module";
import * as path from "node:path";
import { Is } from "../type-checks.js";
import { Workspace } from "../workspace.js";
import { ModelCache } from "./cache.js";
import { Ontology } from "./ontology.js";
import { Project } from "./project.js";

export const PACKAGE_JSON = "package.json";

export interface PackageConfig {
    name?: unknown; // string
    version?: unknown; // string
    description?: unknown; // string
    keywords?: unknown; // string[]
    homepage?: unknown; // string
    bugs?: unknown; // Bugs
    license?: unknown; // string
    author?: unknown; // PersonConfig
    contributors?: unknown; // PersonConfig[]
    maintainers?: unknown; // PersonConfig[]
    repository?: unknown; // RepositoryConfig
    dependencies?: unknown; // Record<string, string>
    devDependencies?: unknown; // Record<string, string>

    ontologies?: unknown, // Record<DocumentUri, string>
}

export type Bugs =
    | string
    | { url?: string, email?: string }

export namespace Bugs {

    export function is(value: any): value is Bugs {
        const candidate = value as Bugs;
        return Is.string(candidate) || (Is.objectLiteral(candidate)
            && (Is.undefined(candidate.url) || Is.string(candidate.url))
            && (Is.undefined(candidate.email) || Is.string(candidate.email)));
    }
}

export type PersonConfig =
    | string
    | { name: string, url?: string, email?: string };

export namespace PersonConfig {

    export function is(value: any): value is PersonConfig {
        const candidate = value as PersonConfig;
        return Is.string(candidate) || (Is.objectLiteral(candidate)
            && Is.string(candidate.name)
            && (Is.undefined(candidate.url) || Is.string(candidate.url))
            && (Is.undefined(candidate.email) || Is.string(candidate.email)));
    }
}

export type RepositoryConfig =
    | string
    | { type: string, url: string, directory?: string }

export namespace RepositoryConfig {

    export function is(value: any): value is RepositoryConfig {
        const candidate = value as RepositoryConfig;
        return Is.string(candidate) || (Is.objectLiteral(candidate)
            && Is.string(candidate.type)
            && Is.string(candidate.url)
            && (Is.undefined(candidate.directory) || Is.string(candidate.directory)));
    }
}

export class Package extends Workspace {
    private _dependencies?: ReadonlyMap<string, Package | null>;
    private _files?: ReadonlyMap<string, Ontology>;
    private _json?: PackageConfig;
    private _ontologies?: ReadonlyMap<DocumentUri, Ontology | null>;

    constructor(packagePath: string, readonly containingProject: Project, private readonly cache: ModelCache) {
        super(packagePath);
    }

    get dependencies(): ReadonlyMap<string, Package | null> {
        return this._dependencies ??= getDependencies(this.json, this, this.cache);
    }

    get description(): string | undefined {
        return Is.string(this.json.description) ? this.json.description : undefined;
    }

    get files(): ReadonlyMap<string, Ontology> {
        return this._files ??= getFiles(this.json, this, this.cache);
    }

    get json(): PackageConfig {
        return this._json ??= getPackageConfig(this);
    }

    get ontologies(): ReadonlyMap<DocumentUri, Ontology | null> {
        return this._ontologies ??= getOntologies(this.json, this, this.cache);
    }

    get version(): string | undefined {
        return Is.string(this.json.version) ? this.json.version : undefined;
    }
}

function getDependencies(json: PackageConfig, containingPackage: Package, cache: ModelCache): Map<string, Package | null> {
    const dependencies = new Map<string, Package | null>();

    if (Is.objectLiteral(json.dependencies)) {
        const require = module.createRequire(containingPackage.directoryPath);
        for (const moduleName in json.dependencies) {
            const modulesPaths = require.resolve.paths(moduleName);
            if (modulesPaths) {
                let package_: Package | null = null;
                for (const modulesPath of modulesPaths) {
                    if (fs.existsSync(path.join(modulesPath, moduleName, PACKAGE_JSON))) {
                        const modulePath = path.join(modulesPath, moduleName);
                        const realModulePath = fs.realpathSync(modulePath);
                        package_ = cache.packages.get(realModulePath) || null;
                        if (!package_) {
                            cache.packages.set(realModulePath, package_ = new Package(modulePath, containingPackage.containingProject, cache));
                        }
                        break;
                    }
                }
                dependencies.set(moduleName, package_);
            }
        }
    }

    return dependencies;
}

function getFiles(json: PackageConfig, containingPackage: Package, cache: ModelCache): Map<string, Ontology> {
    const files = new Map<string, Ontology>();

    if (Is.record(json.ontologies, Is.string)) {
        for (const documentURI in json.ontologies) {
            const filePath = containingPackage.resolve(json.ontologies[documentURI]);
            if (fs.existsSync(filePath)) {
                const realFilePath = fs.realpathSync(filePath);
                let ontology = cache.files.get(realFilePath) || null;
                if (!ontology) {
                    cache.files.set(realFilePath, ontology = new Ontology(documentURI, filePath, containingPackage.containingProject, cache.diagnostics));
                }
                files.set(filePath, ontology);
            }
        }
    }

    return files;
}

function getOntologies(json: PackageConfig, containingPackage: Package, cache: ModelCache): Map<DocumentUri, Ontology | null> {
    const ontologies = new Map<DocumentUri, Ontology | null>();

    if (Is.record(json.ontologies, Is.string)) {
        for (const documentURI in json.ontologies) {
            let ontology: Ontology | null = null;
            const filePath = containingPackage.resolve(json.ontologies[documentURI]);
            if (fs.existsSync(filePath)) {
                const realFilePath = fs.realpathSync(filePath);
                ontology = cache.files.get(realFilePath) || null;
                if (!ontology) {
                    cache.files.set(realFilePath, ontology = new Ontology(documentURI, filePath, containingPackage.containingProject, cache.diagnostics));
                }
            }
            ontologies.set(documentURI, ontology);
        }
    }

    return ontologies;
}

function getPackageConfig(workspace: Workspace): PackageConfig {
    const value = workspace.readJSON(PACKAGE_JSON);
    if (!Is.objectLiteral(value)) {
        throw new Error("Invalid " + PACKAGE_JSON);
    }
    return value;
}
