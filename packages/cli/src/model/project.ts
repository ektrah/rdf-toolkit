import { Ix } from "@rdf-toolkit/iterable";
import { DiagnosticBag, DocumentUri } from "@rdf-toolkit/text";
import * as fs from "node:fs";
import * as module from "node:module";
import * as path from "node:path";
import { Is } from "../type-checks.js";
import { Workspace } from "../workspace.js";
import { Package } from "./package.js";
import { TextFile } from "./textfile.js";

export const CONFIG_JSON = "rdfconfig.json";
export const PACKAGE_JSON = "package.json";

export interface ProjectConfig {
    siteOptions?: SiteConfig,
}

export namespace ProjectConfig {

    export function is(value: any): value is ProjectConfig {
        const candidate = value as ProjectConfig;
        return Is.objectLiteral(candidate)
            && (Is.undefined(candidate.siteOptions) || SiteConfig.is(candidate.siteOptions));
    }
}

export interface SiteConfig {
    title?: string;
    icons?: Array<IconConfig>;
    assets?: Record<string, string>;
    baseURL?: string;
    outDir?: string;
}

export namespace SiteConfig {

    export function is(value: any): value is SiteConfig {
        const candidate = value as SiteConfig;
        return Is.objectLiteral(candidate)
            && (Is.undefined(candidate.title) || Is.string(candidate.title))
            && (Is.undefined(candidate.icons) || Is.typedArray(candidate.icons, IconConfig.is))
            && (Is.undefined(candidate.assets) || Is.objectLiteral(candidate.assets))
            && (Is.undefined(candidate.baseURL) || Is.string(candidate.baseURL))
            && (Is.undefined(candidate.outDir) || Is.string(candidate.outDir));
    }
}

export interface IconConfig {
    type?: string;
    sizes?: string;
    asset: string;
}

export namespace IconConfig {

    export function is(value: any): value is IconConfig {
        const candidate = value as IconConfig;
        return Is.objectLiteral(candidate)
            && (Is.undefined(candidate.type) || Is.string(candidate.type))
            && (Is.undefined(candidate.sizes) || Is.string(candidate.sizes))
            && Is.string(candidate.asset);
    }
}

export class Project {
    private _files?: ReadonlyMap<string, ReadonlySet<TextFile>>;
    private _json?: ProjectConfig;
    private _packages?: ReadonlyMap<string, Package | null>;
    private _terms?: ReadonlyMap<string, ReadonlySet<TextFile>>;

    private readonly packageCache: Map<string, Package>;
    private readonly require: NodeRequire;

    readonly package: Package;

    constructor(readonly projectPath: string, readonly diagnostics = DiagnosticBag.create()) {
        this.packageCache = new Map();
        this.require = module.createRequire(this.projectPath);

        const packagePath = fs.realpathSync(projectPath);
        this.packageCache.set(packagePath, this.package = new Package(packagePath, this));
    }

    get files(): ReadonlyMap<DocumentUri, ReadonlySet<TextFile>> {
        return this._files ??= getFiles(this.packages.values());
    }

    get json(): ProjectConfig {
        return this._json ??= getProjectConfig(this.package);
    }

    get packages(): ReadonlyMap<string, Package | null> {
        return this._packages ??= getPackages(this.package);
    }

    get terms(): ReadonlyMap<string, ReadonlySet<TextFile>> {
        return this._terms ??= getTerms(this.files);
    }

    resolveImport(ontologyIRI: string): [DocumentUri, TextFile | null] {
        const url = new URL(ontologyIRI);
        url.hash = "";
        const documentURI: DocumentUri = url.href;

        const fileSet = this.files.get(documentURI);
        let file: TextFile | null = null;

        if (fileSet && fileSet.size) {
            file = Ix.from(fileSet).singleOrDefault(null);
            if (!file) {
                console.log(`Ambiguous import: <${documentURI}> is provided by multiple packages`);
            }
        }

        return [url.href, file];
    }

    resolvePackage(packageName: string): Package | null {
        const candidatePaths = this.require.resolve.paths(packageName);

        if (candidatePaths) {
            for (const candidatePath of candidatePaths) {
                if (fs.existsSync(path.join(candidatePath, packageName, PACKAGE_JSON))) {
                    const packagePath = fs.realpathSync(path.join(candidatePath, packageName));
                    let package_ = this.packageCache.get(packagePath);
                    if (!package_) {
                        this.packageCache.set(packagePath, package_ = new Package(packagePath, this));
                    }
                    return package_;
                }
            }
        }

        return null;
    }
}

function getFiles(packages: Iterable<Package | null>): Map<string, ReadonlySet<TextFile>> {
    const files = new Map<string, Set<TextFile>>();

    for (const package_ of packages) {
        if (package_) {
            for (const [documentURI, file] of package_.files) {
                let fileSet = files.get(documentURI);
                if (!fileSet) {
                    files.set(documentURI, fileSet = new Set());
                }
                if (file) {
                    fileSet.add(file);
                }
            }
        }
    }

    return files;
}

function getPackages(root: Package): Map<string, Package | null> {
    const packages = new Map<string, Package | null>().set("", root);
    const queue = [root];

    for (let i = 0; i < queue.length; i++) {
        for (const [moduleName, package_] of queue[i].dependencies) {
            if (package_ && !packages.has(moduleName)) {
                packages.set(moduleName, package_);
                queue.push(package_);
            }
        }
    }

    return packages;
}

function getProjectConfig(workspace: Workspace): ProjectConfig {
    const value = workspace.exists(CONFIG_JSON) ? workspace.readJSON(CONFIG_JSON) : {};
    if (!ProjectConfig.is(value)) {
        throw new Error("Invalid " + CONFIG_JSON);
    }
    return value;
}

function getTerms(files: ReadonlyMap<string, ReadonlySet<TextFile>>): Map<string, Set<TextFile>> {
    const terms = new Map<string, Set<TextFile>>();

    for (const fileSet of files.values()) {
        for (const file of fileSet) {
            for (const term of file.terms) {
                let termSet = terms.get(term.value);
                if (!termSet) {
                    terms.set(term.value, termSet = new Set());
                }
                termSet.add(file);
            }
        }
    }

    return terms;
}
