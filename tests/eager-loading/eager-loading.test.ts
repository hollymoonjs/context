import { describe, it, expect, vi } from "vitest";
import { ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";

describe("Eager loading", () => {
    it("should eagerly load entry when eager option is true", async () => {
        const buildFn = vi.fn<() => string>().mockReturnValue("eager value");
        const otherBuildFn = vi.fn<() => string>().mockReturnValue("other value");

        function EagerEntry() {
            return buildFn();
        }

        function OtherEntry() {
            return otherBuildFn();
        }

        const builder = new ContextBuilder()
            .add(cachedEntry(EagerEntry, { eager: true }))
            .add(cachedEntry(OtherEntry, { eager: false }));
        const context = builder.build();

        // Trigger initialization by accessing any entry
        await context.get(OtherEntry);

        // Eager entry should have been built during initialization
        expect(buildFn).toHaveBeenCalledTimes(1);
        // Other entry was also accessed
        expect(otherBuildFn).toHaveBeenCalledTimes(1);

        await context.close();
    });

    it("should not eagerly load entry when eager option is false", async () => {
        const buildFn = vi.fn<() => string>().mockReturnValue("lazy value");

        function LazyEntry() {
            return buildFn();
        }

        const builder = new ContextBuilder(
            cachedEntry(LazyEntry, { eager: false })
        );
        const context = builder.build();

        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(buildFn).not.toHaveBeenCalled();

        await context.get(LazyEntry);
        expect(buildFn).toHaveBeenCalledTimes(1);

        await context.close();
    });
});
