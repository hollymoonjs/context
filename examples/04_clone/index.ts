import { cachedEntry, Context, ContextBuilder, valueEntry } from "@hollymoon/context";

function Authentication() {
    console.log("Authentication built");
    return {
        user: { organizations: ["org1", "org2"] },
    };
}

async function Organization(context: Context) {
    const authentication = await context.get(Authentication);
    console.log("Organization built");
    return authentication.user.organizations[0];
}

async function main() {
    const builder = new ContextBuilder()
        .add(cachedEntry(Authentication, {
            clone: async (currentCtx, target) => {
                // Reuse the existing authentication value
                const auth = await currentCtx.get(Authentication);
                target.add(valueEntry(Authentication, auth));
            }
        }))
        .add(cachedEntry(Organization, {
            clone: async (currentCtx, target) => {
                // Reuse the existing organization value
                const org = await currentCtx.get(Organization);
                target.add(valueEntry(Organization, org));
            }
        }));

    const context = builder.build();

    // Access entries in parent
    console.log("Parent organization:", await context.get(Organization));

    // Clone the context
    const clonedContext = (await context.clone()).build();

    // Close parent - cloned should still work
    await context.close();
    console.log("Parent closed");

    // Access cloned context - should work!
    console.log("Cloned organization:", await clonedContext.get(Organization));

    await clonedContext.close();
    console.log("Done!");
}

main().catch(console.error);
