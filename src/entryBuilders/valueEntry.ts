import { ContextBuilder } from "../context";
import { Entry, EntryBuilder, EntryKey } from "../types";

interface ValueEntry<T> extends Entry<T> {
    value: T;
}

export function valueEntry<T>(key: EntryKey<T>, value: T): EntryBuilder<T> {
    return {
        key: key,
        build: () => {
            const entry: ValueEntry<T> = {
                value,
                get: () => entry.value,
                clone: (currentContext, target) => {
                    target.add(valueEntry(key, entry.value));
                },
            };

            return entry;
        },
    };
}
