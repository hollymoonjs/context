import { Context } from "../context";
import { Entry, EntryBuilder, EntryBuilderFunction, EntryKey } from "../types";

export interface CachedEntryOptions<T> {
    key?: EntryKey<T>;
    close?: (context: Context, value: T) => Promise<void> | void;
}

interface CachedEntry<T> extends Entry<T> {
    loaded: boolean;
    value?: Promise<T> | T;
}

export function cachedEntry<T>(
    builder: EntryBuilderFunction<T>,
    options: CachedEntryOptions<T> = {}
): EntryBuilder<T> {
    return {
        key: options.key ?? builder,
        build: () => {
            const entry: CachedEntry<T> = {
                value: undefined,
                loaded: false,
                get: async (context) => {
                    if (!entry.loaded) {
                        entry.loaded = true;
                        entry.value = builder(context);
                    }

                    return (await entry.value) as T;
                },
                close: async (context) => {
                    if (options.close) {
                        await options.close(context, entry.value as T);
                    }
                },
            };

            return entry;
        },
    };
}
