export interface ProjectConfig {
    files?: Record<string, string>,
    siteOptions?: SiteConfig,
}

export namespace ProjectConfig {

    export function is(value: any): value is ProjectConfig {
        const candidate = value as ProjectConfig;
        return Is.objectLiteral(candidate)
            && (Is.undefined(candidate.files) || Is.objectLiteral(candidate.files))
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

namespace Is {

    export function defined(value: any): boolean {
        return typeof value !== "undefined";
    }

    export function undefined(value: any): boolean { // eslint-disable-line no-shadow-restricted-names
        return typeof value === "undefined";
    }

    export function boolean(value: any): value is boolean {
        return value === true || value === false;
    }

    export function string(value: any): value is string {
        return typeof value === "string";
    }

    export function number(value: any): value is number {
        return typeof value === "number";
    }

    export function integer(value: any): value is number {
        return typeof value === "number" && Number.isSafeInteger(value);
    }

    export function objectLiteral(value: any): value is object {
        return value !== null && typeof value === 'object';
    }

    export function typedArray<T>(value: any, check: (value: any) => boolean): value is T[] {
        return Array.isArray(value) && value.every(check);
    }
}
