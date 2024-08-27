import { Context } from "../context";
import { Entry, EntryBuilder, EntryBuilderFunction, EntryKey } from "../types";

export interface CachedEntryOptions<T> {
    close?: (context: Context, value: T) => Promise<void> | void;
    eager?: boolean;
}

const defaultOptions: CachedEntryOptions<unknown> = {};

interface CachedEntry<T> extends Entry<T> {
    loaded: boolean;
    value?: Promise<T> | T;
}

function parseArgs<T>(
    arg1: EntryKey<T> | EntryBuilderFunction<T>,
    arg2?: EntryBuilderFunction<T> | CachedEntryOptions<T>,
    arg3?: CachedEntryOptions<T>
): [EntryKey<T>, EntryBuilderFunction<T>, CachedEntryOptions<T>] {
    if (arg3) {
        return [arg1 as EntryKey<T>, arg2 as EntryBuilderFunction<T>, arg3];
    }
    if (arg2 && typeof arg2 === "function") {
        return [arg1 as EntryKey<T>, arg2 as EntryBuilderFunction<T>, defaultOptions];
    }
    if (arg2 && typeof arg2 === "object") {
        return [arg1 as EntryKey<T>, arg1 as EntryBuilderFunction<T>, arg2];
    }

    return [arg1 as EntryKey<T>, arg1 as EntryBuilderFunction<T>, defaultOptions];
}

export function cachedEntry<T>(
    key: EntryKey<T>,
    builder: EntryBuilderFunction<T>,
    options?: CachedEntryOptions<T>
): EntryBuilder<T>;
export function cachedEntry<T>(builder: EntryBuilderFunction<T>, options?: CachedEntryOptions<T>): EntryBuilder<T>;
export function cachedEntry<T>(
    keyOrBuilder: EntryKey<T> | EntryBuilderFunction<T>,
    builderOrOptions?: EntryBuilderFunction<T> | CachedEntryOptions<T>,
    _options?: CachedEntryOptions<T>
): EntryBuilder<T> {
    const [key, builder, options] = parseArgs(keyOrBuilder, builderOrOptions, _options);

    return {
        key,
        build: async (context) => {
            const entry: CachedEntry<T> = {
                value: undefined,
                loaded: false,
                get: async () => {
                    if (!entry.loaded) {
                        entry.loaded = true;
                        entry.value = builder(context);
                    }

                    return (await entry.value) as T;
                },
                close: async (context) => {
                    if (!entry.loaded) {
                        return;
                    }

                    if (options.close) {
                        await options.close(context, entry.value as T);
                    }
                },
            };

            if (options.eager) {
                entry.get(context);
            }

            return entry;
        },
    };
}
