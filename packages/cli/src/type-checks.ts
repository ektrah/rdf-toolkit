export namespace Is {

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
        return value !== null && typeof value === "object";
    }

    export function typedArray<T>(value: any, is: (value: any) => value is T): value is T[] {
        return Array.isArray(value) && value.every(is);
    }

    export function record<T>(value: any, is: (value: any) => value is T): value is Record<string, T> {
        return value !== null && typeof value === "object" && Object.values(value).every(is);
    }
}
