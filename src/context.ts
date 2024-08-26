import { ContextClosedError, ContextEntryNotFoundError } from "./errors";
import { matchKey } from "./helpers";
import { Entry, EntryBuilder, EntryKey } from "./types";

export class ContextBuilder {
    protected entryBuilders: EntryBuilder<unknown>[];

    constructor(...entryBuilders: EntryBuilder<unknown>[]) {
        this.entryBuilders = entryBuilders;
    }

    add<T>(entry: EntryBuilder<T>): ContextBuilder {
        const index = this.entryBuilders.findIndex((builder) =>
            matchKey(builder, entry)
        );
        if (index !== -1) {
            this.entryBuilders[index] = entry;
        } else {
            this.entryBuilders.push(entry);
        }

        return this;
    }

    async withContext(fn: (context: Context) => Promise<void>): Promise<void> {
        const entries = [];

        for (const entryBuilder of this.entryBuilders) {
            const entry = (await entryBuilder.build()) as EntryWithKey<unknown>;
            entry.key = entryBuilder.key;
            entries.push(entry);
        }

        const context = new Context(...entries);

        await fn(context);

        await context.close();
    }
}

export interface EntryWithKey<T> extends Entry<T> {
    key: EntryKey<T>;
}

export class Context {
    private entries: EntryWithKey<unknown>[];
    private closed: boolean = false;

    constructor(...entries: EntryWithKey<unknown>[]) {
        this.entries = entries;
    }

    async get<T>(key: EntryKey<T>): Promise<T> {
        if (this.closed) {
            throw new ContextClosedError();
        }

        const entry = this.entries.find((entry) => matchKey(entry.key, key));
        if (!entry) {
            throw new ContextEntryNotFoundError(key);
        }

        const value = await entry.get(this);

        return value as T;
    }

    async close(): Promise<void> {
        if (this.closed) {
            throw new ContextClosedError();
        }

        this.closed = true;

        for (const entry of this.entries) {
            if (entry.close) {
                await entry.close(this);
            }
        }
    }

    fork(): ContextBuilder {
        if (this.closed) {
            throw new ContextClosedError();
        }

        const forkedEntries: EntryBuilder<unknown>[] = [];
        for (const entry of this.entries) {
            forkedEntries.push({
                key: entry.key,
                build: () => ({
                    get: () => {
                        return entry.get(this);
                    },
                }),
            });
        }

        return new ContextBuilder(...forkedEntries);
    }
}
