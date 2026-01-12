import type { Context, ContextBuilder } from "./context";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars, @typescript-eslint/no-wrapper-object-types
export interface SymbolEntryKey<T> extends Symbol {}

export interface EntryBuilder<T> {
    key: EntryKey<T>;
    build: (context: Context) => Promise<Entry<T>> | Entry<T>;
}

export type EntryBuilderFunction<T> = (context: Context) => T | Promise<T>;

export type EntryKey<T> = string | SymbolEntryKey<T> | EntryBuilder<T> | EntryBuilderFunction<T>;

export interface Entry<T> {
    get: (context: Context) => Promise<T> | T;
    close?: (context: Context) => Promise<void> | void;
    clone?: (currentContext: Context, target: ContextBuilder) => Promise<void> | void;
}
