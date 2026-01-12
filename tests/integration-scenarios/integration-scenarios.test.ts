import { describe, it, expect } from "vitest";
import { Context, ContextBuilder } from "../../src/context";
import { cachedEntry } from "../../src/entryBuilders/cachedEntry";
import { valueEntry } from "../../src/entryBuilders/valueEntry";

describe("Complex integration scenarios", () => {
    it("should handle real-world authentication scenario", async () => {
        function Authentication() {
            return {
                token: "jwt-token",
                userId: "user-123",
                organizationId: "org-456",
            };
        }

        async function User(context: Context) {
            const auth = await context.get(Authentication);
            return {
                id: auth.userId,
                name: "John Doe",
            };
        }

        async function Organization(context: Context) {
            const auth = await context.get(Authentication);
            return {
                id: auth.organizationId,
                name: "Acme Corp",
            };
        }

        async function Permissions(context: Context) {
            const user = await context.get(User);
            const org = await context.get(Organization);
            return {
                canRead: true,
                canWrite: user.id === "user-123" && org.id === "org-456",
            };
        }

        const builder = new ContextBuilder()
            .add(cachedEntry(Authentication))
            .add(cachedEntry(User))
            .add(cachedEntry(Organization))
            .add(cachedEntry(Permissions));

        await builder.withContext(async (context) => {
            const permissions = await context.get(Permissions);
            expect(permissions.canRead).toBe(true);
            expect(permissions.canWrite).toBe(true);
        });
    });

    it("should handle database connection simulation with cleanup", async () => {
        const connections: string[] = [];

        function Database() {
            const connectionId = `conn-${Math.random().toString(36).slice(2)}`;
            connections.push(connectionId);
            return {
                connectionId,
                query: (sql: string) => `Result of: ${sql}`,
            };
        }

        const builder = new ContextBuilder(
            cachedEntry(Database, {
                close: (_, db) => {
                    const index = connections.indexOf(db.connectionId);
                    if (index > -1) {
                        connections.splice(index, 1);
                    }
                },
            })
        );

        expect(connections).toHaveLength(0);

        await builder.withContext(async (context) => {
            const db = await context.get(Database);
            expect(connections).toHaveLength(1);
            expect(db.query("SELECT 1")).toBe("Result of: SELECT 1");
        });

        expect(connections).toHaveLength(0);
    });

    it("should handle forked context with different auth", async () => {
        function Authentication() {
            return { userId: "parent-user" };
        }

        async function UserData(context: Context) {
            const auth = await context.get(Authentication);
            return { data: `data for ${auth.userId}` };
        }

        const parentBuilder = new ContextBuilder()
            .add(cachedEntry(Authentication))
            .add(cachedEntry(UserData));

        const parentContext = parentBuilder.build();

        const parentData = await parentContext.get(UserData);
        expect(parentData.data).toBe("data for parent-user");

        const childBuilder = parentContext
            .fork()
            .add(valueEntry(Authentication, { userId: "child-user" }))
            .add(cachedEntry(UserData));

        const childContext = childBuilder.build();

        const childData = await childContext.get(UserData);
        expect(childData.data).toBe("data for child-user");

        await childContext.close();
        await parentContext.close();
    });
});
