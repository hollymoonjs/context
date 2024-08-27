import { ContextClosedError, ContextEntryNotFoundError } from "./errors";
import { matchKey } from "./helpers";
import { Entry, EntryBuilder, EntryKey } from "./types";

export class ContextBuilder {
    protected entryBuilders: EntryBuilder<unknown>[];

    constructor(...entryBuilders: EntryBuilder<unknown>[]) {
        this.entryBuilders = entryBuilders;
    }

    add<T>(entry: EntryBuilder<T>): ContextBuilder {
        const index = this.entryBuilders.findIndex((builder) => matchKey(builder, entry));
        if (index !== -1) {
            this.entryBuilders[index] = entry;
        } else {
            this.entryBuilders.push(entry);
        }

        return this;
    }

    fork(): ContextBuilder {
        return new ContextBuilder(...this.entryBuilders);
    }

    build(): Context {
        return new Context(...this.entryBuilders);
    }

    async withContext(fn: (context: Context) => Promise<void>): Promise<void> {
        const context = this.build();

        await fn(context);

        await context.close();
    }
}

export interface EntryWithKey<T> extends Entry<T> {
    key: EntryKey<T>;
}

export class Context {
    private entryBuilders: EntryBuilder<unknown>[];

    private initialized = false;
    private entries: EntryWithKey<unknown>[] = [];
    private closed: boolean = false;

    constructor(...entryBuilders: EntryBuilder<unknown>[]) {
        this.entryBuilders = entryBuilders;
    }

    private async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        this.initialized = true;

        for (const entryBuilder of this.entryBuilders) {
            const entry = (await entryBuilder.build(this)) as EntryWithKey<unknown>;
            entry.key = entryBuilder.key;
            this.entries.push(entry);
        }
    }

    private async getEntry<T>(key: EntryKey<T>): Promise<EntryWithKey<T>> {
        if (this.closed) {
            throw new ContextClosedError();
        }
        await this.initialize();

        const entry = this.entries.find((entry) => matchKey(entry.key, key));
        if (!entry) {
            throw new ContextEntryNotFoundError(key);
        }

        return entry as EntryWithKey<T>;
    }

    async get<T>(key: EntryKey<T>): Promise<T> {
        if (this.closed) {
            throw new ContextClosedError();
        }

        const entry = await this.getEntry(key);

        return await entry.get(this);
    }

    async close(): Promise<void> {
        if (this.closed) {
            throw new ContextClosedError();
        }

        this.closed = true;

        await this.initialize();

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

        const forkedBuilders: EntryBuilder<unknown>[] = [];
        for (const entryBuilder of this.entryBuilders) {
            forkedBuilders.push({
                key: entryBuilder.key,
                build: async () => {
                    await this.initialize();
                    const entry = await this.getEntry(entryBuilder.key);

                    return {
                        get: () => {
                            return entry.get(this);
                        },
                    };
                },
            });
        }

        return new ContextBuilder(...forkedBuilders);
    }
}
