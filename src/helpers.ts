import { EntryKey } from "./types";

export function matchKey(
    keyA: EntryKey<unknown>,
    keyB: EntryKey<unknown>
): boolean {
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
