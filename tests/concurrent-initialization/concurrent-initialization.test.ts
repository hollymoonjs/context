import { describe, it, expect } from "vitest";
import { ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";

describe("Concurrent initialization", () => {
    it("does not miss an entry when gets run concurrently during initialization", async () => {
        function First() {
            return "first";
        }
        function Second() {
            return "second";
        }
        function Third() {
            return "third";
        }

        const context = new ContextBuilder()
            .add(cachedEntry(First))
            .add(cachedEntry(Second))
            .add(cachedEntry(Third))
            .build();

        // The first get triggers initialization; the second races it and must
        // still resolve its entry rather than observing a half-built context.
        const [first, third] = await Promise.all([
            context.get(First),
            context.get(Third),
        ]);

        expect(first).toBe("first");
        expect(third).toBe("third");

        await context.close();
    });

    it("initializes the context only once across concurrent gets", async () => {
        let builds = 0;
        function Counted() {
            builds++;
            return builds;
        }
        function Other() {
            return "other";
        }

        const context = new ContextBuilder()
            .add(cachedEntry(Counted))
            .add(cachedEntry(Other))
            .build();

        await Promise.all([context.get(Counted), context.get(Other)]);

        expect(builds).toBe(1);

        await context.close();
    });
});
