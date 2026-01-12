import { describe, it, expect, vi } from "vitest";
import { Context, ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";

describe("Lifecycle management", () => {
    it("should call close callback when context closes", async () => {
        const closeFn = vi.fn();

        function MyEntry() {
            return { resource: "open" };
        }

        const builder = new ContextBuilder(
            cachedEntry(MyEntry, { close: closeFn })
        );
        const context = builder.build();

        await context.get(MyEntry);
        await context.close();

        expect(closeFn).toHaveBeenCalledTimes(1);
        expect(closeFn).toHaveBeenCalledWith(
            expect.any(Context),
            { resource: "open" }
        );
    });

    it("should not call close callback if entry was never accessed", async () => {
        const closeFn = vi.fn();

        function MyEntry() {
            return "value";
        }

        const builder = new ContextBuilder(
            cachedEntry(MyEntry, { close: closeFn })
        );
        const context = builder.build();

        await context.close();

        expect(closeFn).not.toHaveBeenCalled();
    });

    it("should call close callbacks in order", async () => {
        const closeOrder: string[] = [];

        function EntryA() {
            return "A";
        }

        function EntryB() {
            return "B";
        }

        const builder = new ContextBuilder()
            .add(
                cachedEntry(EntryA, {
                    close: () => {
                        closeOrder.push("A");
                    },
                })
            )
            .add(
                cachedEntry(EntryB, {
                    close: () => {
                        closeOrder.push("B");
                    },
                })
            );

        const context = builder.build();

        await context.get(EntryA);
        await context.get(EntryB);
        await context.close();

        expect(closeOrder).toEqual(["A", "B"]);
    });

    it("should support async close callbacks", async () => {
        const events: string[] = [];

        function MyEntry() {
            events.push("built");
            return "value";
        }

        const builder = new ContextBuilder(
            cachedEntry(MyEntry, {
                close: async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    events.push("closed");
                },
            })
        );

        const context = builder.build();
        await context.get(MyEntry);
        await context.close();

        expect(events).toEqual(["built", "closed"]);
    });
});
