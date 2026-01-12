import { describe, it, expect } from "vitest";
import { ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";
import { valueEntry } from "../../src/entryBuilders/valueEntry";
import { CloneNotSupportedError } from "../../src/errors";
import { SymbolEntryKey } from "../../src/types";

describe("Context cloning", () => {
    it("should clone context with valueEntry", async () => {
        function MyEntry() {
            return "value";
        }

        const builder = new ContextBuilder(
            valueEntry(MyEntry, "original value")
        );
        const context = builder.build();

        await context.get(MyEntry);

        const clonedBuilder = await context.clone();
        const clonedContext = clonedBuilder.build();

        await context.close();

        const clonedResult = await clonedContext.get(MyEntry);

        expect(clonedResult).toBe("original value");
        await clonedContext.close();
    });

    it("should support custom clone implementation", async () => {
        const MySymbol: SymbolEntryKey<number> = Symbol("Counter");
        let counter = 0;

        const builder = new ContextBuilder(
            cachedEntry(MySymbol, () => ++counter, {
                clone: async (currentContext, target) => {
                    const currentValue = await currentContext.get(MySymbol);
                    target.add(valueEntry(MySymbol, currentValue));
                },
            })
        );

        const context = builder.build();
        const originalValue = await context.get(MySymbol);

        const clonedBuilder = await context.clone();
        const clonedContext = clonedBuilder.build();

        const clonedValue = await clonedContext.get(MySymbol);

        expect(originalValue).toBe(1);
        expect(clonedValue).toBe(1);
        expect(counter).toBe(1);

        await context.close();
        await clonedContext.close();
    });

    it("should throw CloneNotSupportedError for entries without clone", async () => {
        function NoCloneEntry() {
            return "no clone";
        }

        const builder = new ContextBuilder(cachedEntry(NoCloneEntry));
        const context = builder.build();

        await context.get(NoCloneEntry);

        const clonedBuilder = await context.clone();
        const clonedContext = clonedBuilder.build();

        await expect(clonedContext.get(NoCloneEntry)).rejects.toThrow(
            CloneNotSupportedError
        );

        await context.close();
        await clonedContext.close();
    });
});
