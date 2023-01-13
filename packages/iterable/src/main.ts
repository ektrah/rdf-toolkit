export class Ix<T> implements Iterable<T> {

    static readonly empty: Ix<never> = new Ix({
        [Symbol.iterator]: function* () { }
    });

    static from<T>(iterable: Iterable<T> | null | undefined): Ix<T> {
        if (iterable === null || typeof iterable === "undefined") {
            return Ix.empty;
        }
        else {
            return new Ix({
                [Symbol.iterator]: function () {
                    return iterable[Symbol.iterator]();
                }
            });
        }
    }

    static of<T>(...items: T[]): Ix<T> {
        return new Ix(items);
    }

    static range(lowerInclusive: number, upperExclusive: number): Ix<number> {
        return new Ix({
            [Symbol.iterator]: function* () {
                for (let i = lowerInclusive; i < upperExclusive; i++) {
                    yield i;
                }
            }
        });
    }

    static sliceOf<T>(items: ArrayLike<T>, start: number, count: number) {
        return new Ix({
            [Symbol.iterator]: function* () {
                for (let i = 0; i < count; i++) {
                    yield items[start + i];
                }
            }
        });
    }

    private constructor(private readonly source: Iterable<T>) {
    }

    [Symbol.iterator](): Iterator<T> {
        return this.source[Symbol.iterator]();
    }

    concat(other: Iterable<T>): Ix<T> {
        const source = this.source;
        return new Ix({
            [Symbol.iterator]: function* () {
                for (const item of source) {
                    yield item;
                }
                for (const item of other) {
                    yield item;
                }
            }
        });
    }

    concatIfEmpty(other: Iterable<T>): Ix<T> {
        const source = this.source;
        return new Ix({
            [Symbol.iterator]: function* () {
                let empty = true;
                for (const item of source) {
                    empty = false;
                    yield item;
                }
                if (empty) {
                    for (const item of other) {
                        yield item;
                    }
                }
            }
        });
    }

    concatMap<U>(selector: (item: T) => Iterable<U>): Ix<U> {
        const source = this.source;
        return new Ix({
            [Symbol.iterator]: function* () {
                for (const outer of source) {
                    for (const inner of selector(outer)) {
                        yield inner;
                    }
                }
            }
        });
    }

    count(): number {
        if (Array.isArray(this.source)) {
            return this.source.length;
        }
        else if (this.source instanceof Set<T>) {
            return this.source.size;
        }
        else {
            let result = 0;
            for (const item of this.source) {
                result++;
            }
            return result;
        }
    }

    distinct(): Ix<T> {
        return new Ix<T>(new Set<T>(this.source));
    }

    every(predicate: (item: T) => boolean): boolean {
        for (const item of this.source) {
            if (!predicate(item)) {
                return false;
            }
        }
        return true;
    }

    filter(predicate: (item: T) => boolean): Ix<T> {
        const source = this.source;
        return new Ix({
            [Symbol.iterator]: function* () {
                for (const item of source) {
                    if (predicate(item)) {
                        yield item;
                    }
                }
            }
        });
    }

    firstOrDefault<U>(defaultValue: U): T | U {
        for (const item of this.source) {
            return item;
        }
        return defaultValue;
    }

    includes(item: T, comparer: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        for (const item_ of this.source) {
            if (comparer(item_, item)) {
                return true;
            }
        }
        return false;
    }

    intersperse(separator: T): Ix<T> {
        const source = this.source;
        return new Ix({
            [Symbol.iterator]: function* () {
                let first = true;
                for (const item of source) {
                    if (first) {
                        first = false;
                    }
                    else {
                        yield separator;
                    }
                    yield item;
                }
            }
        });
    }

    map<U>(selector: (item: T, index: number) => U): Ix<U> {
        const source = this.source;
        return new Ix({
            [Symbol.iterator]: function* () {
                let index = 0;
                for (const item of source) {
                    yield selector(item, index++);
                }
            }
        });
    }

    ofType<U extends T>(predicate: (item: T) => item is U): Ix<U> {
        const source = this.source;
        return new Ix({
            [Symbol.iterator]: function* () {
                for (const item of source) {
                    if (predicate(item)) {
                        yield item;
                    }
                }
            }
        });
    }

    reduce<U>(seed: U, aggregator: (previous: U, current: T) => U): U {
        let result = seed;
        for (const item of this.source) {
            result = aggregator(result, item);
        }
        return result;
    }

    reverse(): Ix<T> {
        return new Ix(Array.from(this.source).reverse());
    }

    singleOrDefault<U>(defaultValue: U): T | U {
        let result: T | U = defaultValue;
        let first = true;
        for (const item of this.source) {
            if (first) {
                result = item;
                first = false;
            }
            else {
                return defaultValue;
            }
        }
        return result;
    }

    some(predicate: (item: T) => boolean = (item: T) => true): boolean {
        for (const item of this.source) {
            if (predicate(item)) {
                return true;
            }
        }
        return false;
    }

    sort(comparer?: (a: T, b: T) => number): Ix<T> {
        return new Ix(Array.from(this.source).sort(comparer));
    }

    toArray(): T[] {
        return Array.from(this.source);
    }

    toMap<K, V>(keySelector: (item: T) => K, elementSelector: (item: T) => V): Map<K, V> {
        return new Map<K, V>(this.map(item => [keySelector(item), elementSelector(item)]));
    }

    toMultiMap<K, V>(keySelector: (item: T) => K, elementSelector: (item: T) => V): MultiMap<K, V> {
        return new MultiMap<K, V>(this.map(item => [keySelector(item), elementSelector(item)]));
    }

    toSet(): Set<T> {
        return new Set<T>(this.source);
    }

    wrap<U>(selector: (item: Ix<T>) => U, defaultValue: U): U {
        for (const item of this.source) {
            return selector(this);
        }
        return defaultValue;
    }
}

export class MultiMap<K, V> implements ReadonlyMultiMap<K, V> {

    private readonly entries: Map<K, Set<V>> = new Map();

    constructor(items?: Iterable<[K, V]>) {
        if (items) {
            for (const [key, value] of items) {
                let values: Set<V> | undefined = this.entries.get(key);
                if (!values) {
                    this.entries.set(key, values = new Set<V>());
                }
                values.add(value);
            }
        }
    }

    *[Symbol.iterator](): IterableIterator<[K, V]> {
        for (const [key, values] of this.entries) {
            for (const value of values) {
                yield [key, value];
            }
        }
    }

    add(key: K, value: V): boolean {
        let values: Set<V> | undefined = this.entries.get(key);
        if (!values) {
            this.entries.set(key, values = new Set<V>());
        }
        else if (values.has(value)) {
            return false;
        }
        values.add(value);
        return true;
    }

    clear(key: K): void {
        const values: Set<V> | undefined = this.entries.get(key);
        if (!values) {
            return;
        }
        values.clear();
    }

    delete(key: K, value: V): boolean {
        const values: Set<V> | undefined = this.entries.get(key);
        if (!values) {
            return false;
        }
        return values.delete(value);
    }

    get(key: K): Ix<V> {
        const values: Set<V> | undefined = this.entries.get(key);
        if (!values) {
            return Ix.empty;
        }
        return Ix.from(values);
    }

    has(key: K, value: V): boolean {
        const values: Set<V> | undefined = this.entries.get(key);
        if (!values) {
            return false;
        }
        return values.has(value);
    }

    keys(): Ix<K> {
        const entries = this.entries;
        return Ix.from({
            [Symbol.iterator]: function* () {
                for (const [key,] of entries) {
                    yield key;
                }
            }
        });
    }

    values(): Ix<V> {
        const entries = this.entries;
        return Ix.from({
            [Symbol.iterator]: function* () {
                for (const [, values] of entries) {
                    for (const value of values) {
                        yield value;
                    }
                }
            }
        });
    }
}

export interface ReadonlyMultiMap<K, V> {
    [Symbol.iterator](): IterableIterator<[K, V]>;
    get(key: K): Ix<V>;
    has(key: K, value: V): boolean;
    keys(): Ix<K>;
    values(): Ix<V>;
}
