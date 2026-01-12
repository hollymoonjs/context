import { describe, it, expect } from "vitest";
import { ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";
import {
    ContextClosedError,
    ContextEntryNotFoundError,
} from "../../src/errors";

describe("Error handling", () => {
    it("should throw ContextEntryNotFoundError for missing entry", async () => {
        function MissingEntry() {
            return "missing";
        }

        const builder = new ContextBuilder();
        const context = builder.build();

        await expect(context.get(MissingEntry)).rejects.toThrow(
            ContextEntryNotFoundError
        );
        await context.close();
    });

    it("should throw ContextClosedError when getting from closed context", async () => {
        function MyEntry() {
            return "value";
        }

        const builder = new ContextBuilder(cachedEntry(MyEntry));
        const context = builder.build();

        await context.close();

        await expect(context.get(MyEntry)).rejects.toThrow(ContextClosedError);
    });

    it("should throw ContextClosedError when closing already closed context", async () => {
        const builder = new ContextBuilder();
        const context = builder.build();

        await context.close();

        await expect(context.close()).rejects.toThrow(ContextClosedError);
    });

    it("should throw ContextClosedError when forking closed context", async () => {
        function MyEntry() {
            return "value";
        }

        const builder = new ContextBuilder(cachedEntry(MyEntry));
        const context = builder.build();

        await context.close();

        expect(() => context.fork()).toThrow(ContextClosedError);
    });

    it("should throw ContextClosedError when cloning closed context", async () => {
        function MyEntry() {
            return "value";
        }

        const builder = new ContextBuilder(cachedEntry(MyEntry));
        const context = builder.build();

        await context.close();

        await expect(context.clone()).rejects.toThrow(ContextClosedError);
    });
});
