import { EntryKey } from "./types";

export function matchKey(keyA: EntryKey<unknown>, keyB: EntryKey<unknown>): boolean {
    if (keyA === keyB) {
        return true;
    }

    if (typeof keyA === "object" && "key" in keyA && keyA.key !== keyA) {
        return matchKey(keyA.key, keyB);
    }

    if (typeof keyB === "object" && "key" in keyB && keyB.key !== keyB) {
        return matchKey(keyA, keyB.key);
    }

    return false;
}

export function prettyName(key: EntryKey<unknown>): string {
    if (typeof key === "object" && "key" in key && key.key !== key) {
        return prettyName(key.key);
    }

    if (typeof key === "symbol") {
        return key.description ?? key.toString();
    }

    if (typeof key === "function") {
        return key.name;
    }

    if (typeof key === "string") {
        return key;
    }

    if (key?.constructor?.name) {
        return key.constructor.name;
    }

    if (typeof key == "object") {
        return `[anonymous]`;
    }

    return `key`.toString();
}
