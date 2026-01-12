import { describe, it, expect, vi } from "vitest";
import { Context, ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";

describe("Dependency chains", () => {
    it("should resolve dependency chain correctly", async () => {
        const buildOrder: string[] = [];

        function BaseEntry() {
            buildOrder.push("BaseEntry");
            return { baseValue: "base" };
        }

        async function MiddleEntry(context: Context) {
            const base = await context.get(BaseEntry);
            buildOrder.push("MiddleEntry");
            return { middleValue: base.baseValue + "-middle" };
        }

        async function TopEntry(context: Context) {
            const middle = await context.get(MiddleEntry);
            buildOrder.push("TopEntry");
            return { topValue: middle.middleValue + "-top" };
        }

        const builder = new ContextBuilder()
            .add(cachedEntry(BaseEntry))
            .add(cachedEntry(MiddleEntry))
            .add(cachedEntry(TopEntry));

        const context = builder.build();

        const result = await context.get(TopEntry);

        expect(result.topValue).toBe("base-middle-top");
        expect(buildOrder).toEqual(["BaseEntry", "MiddleEntry", "TopEntry"]);
        await context.close();
    });

    it("should share cached values across dependency chain", async () => {
        const baseBuildFn = vi.fn<() => { value: string }>().mockReturnValue({ value: "shared" });

        function BaseEntry() {
            return baseBuildFn();
        }

        async function EntryA(context: Context) {
            const base = await context.get(BaseEntry);
            return { a: `${base.value}-A` };
        }

        async function EntryB(context: Context) {
            const base = await context.get(BaseEntry);
            return { b: `${base.value}-B` };
        }

        const builder = new ContextBuilder()
            .add(cachedEntry(BaseEntry))
            .add(cachedEntry(EntryA))
            .add(cachedEntry(EntryB));

        const context = builder.build();

        await context.get(EntryA);
        await context.get(EntryB);

        expect(baseBuildFn).toHaveBeenCalledTimes(1);
        await context.close();
    });
});
