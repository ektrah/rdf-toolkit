export interface ProjectConfig {
    files?: Record<string, string>,
    siteOptions?: SiteConfig,
}

export namespace ProjectConfig {

    export function is(value: any): value is ProjectConfig {
        const candidate = value as ProjectConfig;
        return (candidate !== null && typeof candidate === "object")
            && (typeof candidate.files === "undefined" || candidate.files !== null && typeof candidate.files === "object")
            && (typeof candidate.siteOptions === "undefined" || SiteConfig.is(candidate.siteOptions))
            ? true : false;
    }
}

export interface SiteConfig {
    title?: string;
    icons?: ReadonlyArray<IconConfig>;
    assets?: Readonly<Record<string, string>>;
    baseURL?: string;
    outDir?: string;
}

export namespace SiteConfig {

    export function is(value: any): value is SiteConfig {
        const candidate = value as SiteConfig;
        return (candidate !== null && typeof candidate === "object")
            && (typeof candidate.title === "undefined" || typeof candidate.title === "string")
            && (typeof candidate.icons === "undefined" || Array.isArray(candidate.icons) && candidate.icons.every(IconConfig.is))
            && (typeof candidate.assets === "undefined" || candidate.assets !== null && typeof candidate.assets === "object")
            && (typeof candidate.baseURL === "undefined" || typeof candidate.baseURL === "string")
            && (typeof candidate.outDir === "undefined" || typeof candidate.outDir === "string")
            ? true : false;
    }
}

export interface IconConfig {
    type?: string;
    sizes?: string;
    file: string;
}

export namespace IconConfig {

    export function is(value: any): value is IconConfig {
        const candidate = value as IconConfig;
        return (candidate !== null && typeof candidate === "object")
            && (typeof candidate.type === "undefined" || typeof candidate.type === "string")
            && (typeof candidate.sizes === "undefined" || typeof candidate.sizes === "string")
            && typeof candidate.file === "string"
            ? true : false;
    }
}
