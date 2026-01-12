import { describe, it, expect, vi } from "vitest";
import { ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";
import { SymbolEntryKey } from "../../src/types";

describe("Basic context building and value retrieval", () => {
    it("should build context and retrieve a simple cached value", async () => {
        function MyEntry() {
            return { value: 42 };
        }

        const builder = new ContextBuilder(cachedEntry(MyEntry));
        const context = builder.build();

        const result = await context.get(MyEntry);

        expect(result).toEqual({ value: 42 });
        await context.close();
    });

    it("should cache values on subsequent gets", async () => {
        const buildFn = vi.fn<() => { value: string }>().mockReturnValue({ value: "cached" });

        function MyEntry() {
            return buildFn();
        }

        const builder = new ContextBuilder(cachedEntry(MyEntry));
        const context = builder.build();

        await context.get(MyEntry);
        await context.get(MyEntry);
        await context.get(MyEntry);

        expect(buildFn).toHaveBeenCalledTimes(1);
        await context.close();
    });

    it("should support async builders", async () => {
        async function AsyncEntry() {
            await new Promise((resolve) => setTimeout(resolve, 10));
            return "async value";
        }

        const builder = new ContextBuilder(cachedEntry(AsyncEntry));
        const context = builder.build();

        const result = await context.get(AsyncEntry);

        expect(result).toBe("async value");
        await context.close();
    });

    it("should work with symbol keys", async () => {
        const MySymbol: SymbolEntryKey<string> = Symbol("MySymbol");

        const builder = new ContextBuilder(
            cachedEntry(MySymbol, () => "symbol value")
        );
        const context = builder.build();

        const result = await context.get(MySymbol);

        expect(result).toBe("symbol value");
        await context.close();
    });

    it("should work with string keys", async () => {
        const builder = new ContextBuilder(
            cachedEntry("myStringKey", () => "string key value")
        );
        const context = builder.build();

        const result = await context.get("myStringKey");

        expect(result).toBe("string key value");
        await context.close();
    });

    it("should support withContext helper", async () => {
        const closeFn = vi.fn();

        function MyEntry() {
            return "value";
        }

        const builder = new ContextBuilder(
            cachedEntry(MyEntry, { close: closeFn })
        );

        await builder.withContext(async (context) => {
            const result = await context.get(MyEntry);
            expect(result).toBe("value");
        });

        expect(closeFn).toHaveBeenCalled();
    });
});
