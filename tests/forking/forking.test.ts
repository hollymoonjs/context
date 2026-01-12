import { describe, it, expect, vi } from "vitest";
import { ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";
import { valueEntry } from "../../src/entryBuilders/valueEntry";
import { ContextEntryNotFoundError } from "../../src/errors";

describe("Context forking", () => {
    it("should fork context and inherit parent values", async () => {
        const buildFn = vi.fn<() => string>().mockReturnValue("parent value");

        function ParentEntry() {
            return buildFn();
        }

        const parentBuilder = new ContextBuilder(cachedEntry(ParentEntry));
        const parentContext = parentBuilder.build();

        await parentContext.get(ParentEntry);

        const forkedBuilder = parentContext.fork();
        const forkedContext = forkedBuilder.build();

        const result = await forkedContext.get(ParentEntry);

        expect(result).toBe("parent value");
        expect(buildFn).toHaveBeenCalledTimes(1);

        await forkedContext.close();
        await parentContext.close();
    });

    it("should allow overriding entries in forked context", async () => {
        function MyEntry() {
            return "original";
        }

        const parentBuilder = new ContextBuilder(cachedEntry(MyEntry));
        const parentContext = parentBuilder.build();

        const forkedBuilder = parentContext
            .fork()
            .add(valueEntry(MyEntry, "overridden"));
        const forkedContext = forkedBuilder.build();

        const parentResult = await parentContext.get(MyEntry);
        const forkedResult = await forkedContext.get(MyEntry);

        expect(parentResult).toBe("original");
        expect(forkedResult).toBe("overridden");

        await forkedContext.close();
        await parentContext.close();
    });

    it("should fork ContextBuilder without affecting original", async () => {
        function EntryA() {
            return "A";
        }

        function EntryB() {
            return "B";
        }

        const originalBuilder = new ContextBuilder(cachedEntry(EntryA));
        const forkedBuilder = originalBuilder.fork().add(cachedEntry(EntryB));

        const originalContext = originalBuilder.build();
        const forkedContext = forkedBuilder.build();

        await expect(originalContext.get(EntryB)).rejects.toThrow(
            ContextEntryNotFoundError
        );
        expect(await forkedContext.get(EntryB)).toBe("B");

        await originalContext.close();
        await forkedContext.close();
    });
});
