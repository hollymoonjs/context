import type { Context } from "./context";

export interface SymbolEntryKey<T> extends Symbol {}

export interface EntryBuilder<T> {
    key: EntryKey<T>;
    build: () => Promise<Entry<T>> | Entry<T>;
}

export type EntryBuilderFunction<T> = (context: Context) => T | Promise<T>;

export type EntryKey<T> =
    | string
    | SymbolEntryKey<T>
    | EntryBuilder<T>
    | EntryBuilderFunction<T>;

export interface Entry<T> {
    get: (context: Context) => Promise<T> | T;
    close?: (context: Context) => Promise<void> | void;
}
