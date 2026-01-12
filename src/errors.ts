import { prettyName } from "./helpers";
import { EntryKey } from "./types";

export class ContextEntryNotFoundError extends Error {
    constructor(key: EntryKey<unknown>) {
        super(`Context entry not found: ${prettyName(key)}`);
        this.name = "ContextEntryNotFoundError";
    }
}

export class ContextClosedError extends Error {
    constructor() {
        super("Context is closed");
        this.name = "ContextClosedError";
    }
}

export class CloneNotSupportedError extends Error {
    constructor(key: EntryKey<unknown>) {
        super(`Clone not supported for entry: ${prettyName(key)}`);
        this.name = "CloneNotSupportedError";
    }
}
