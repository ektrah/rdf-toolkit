import { DiagnosticBag, DocumentUri } from "@rdf-toolkit/text";
import { Is } from "../type-checks.js";
import { ModelCache } from "./cache.js";
import { Ontology } from "./ontology.js";
import { Package } from "./package.js";

export const CONFIG_JSON = "rdfconfig.json";

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
    private readonly cache: ModelCache = {
        packages: new Map(),
        files: new Map(),
        diagnostics: DiagnosticBag.create(),
    };

    private _files?: ReadonlyMap<string, Ontology>;
    private _json?: ProjectConfig;
    private _ontologies?: ReadonlyMap<string, Ontology | null>;
    private _packages?: ReadonlyMap<string, Package | null>;

    readonly package: Package;

    constructor(projectPath: string) {
        this.package = new Package(projectPath, this, this.cache);
    }

    get files(): ReadonlyMap<string, Ontology> {
        return this._files ||= getFiles(this.packages.values());
    }

    get json(): ProjectConfig {
        const value = this.package.exists(CONFIG_JSON) ? this.package.readJSON(CONFIG_JSON) : {};
        if (!ProjectConfig.is(value)) {
            throw new Error("Invalid " + CONFIG_JSON);
        }
        return this._json = value;
    }

    get ontologies(): ReadonlyMap<DocumentUri, Ontology | null> {
        return this._ontologies ||= getOntologies(this.packages.values());
    }

    get packages(): ReadonlyMap<string, Package | null> {
        return this._packages ||= getPackages(this.package);
    }
}

function getFiles(packages: Iterable<Package | null>): Map<string, Ontology> {
    const files = new Map<string, Ontology>();

    for (const package_ of packages) {
        if (package_) {
            for (const [filePath, ontology] of package_.files) {
                files.set(filePath, ontology);
            }
        }
    }

    return files;
}

function getOntologies(packages: Iterable<Package | null>): Map<DocumentUri, Ontology | null> {
    const ontologies = new Map<DocumentUri, Ontology | null>();

    for (const package_ of packages) {
        if (package_) {
            for (const [documentURI, ontology] of package_.ontologies) {
                const ontology_ = ontologies.get(documentURI);
                if (!ontology_ || ontology_ === ontology) {
                    ontologies.set(documentURI, ontology);
                }
                else {
                    // TODO: collision
                }
            }
        }
    }

    return ontologies;
}

function getPackages(root: Package): Map<string, Package | null> {
    const packages = new Map<string, Package | null>().set("", root);
    const queue = [root];

    for (let i = 0; i < queue.length; i++) {
        for (const [moduleName, package_] of queue[i].dependencies) {
            if (!packages.has(moduleName)) {
                packages.set(moduleName, package_);
                if (package_) {
                    queue.push(package_);
                }
            }
        }
    }

    return packages;
}
