import { cachedEntry, Context, ContextBuilder, valueEntry } from "@hollymoon/context";

function Authentication() {
    return {
        user: {
            organizations: ["org1", "org2"],
        },
    };
}

async function Organization(context: Context) {
    const authentication = await context.get(Authentication);

    if (!authentication.user.organizations.length) {
        throw new Error("User is not in any organization");
    }

    return authentication.user.organizations[0];
}

function forkWithOrganization(context: Context, organization: string) {
    return context.fork().add(valueEntry(Organization, "org2"));
}

async function main() {
    const builder = new ContextBuilder(cachedEntry(Authentication), cachedEntry(Organization));

    await builder.withContext(async (context) => {
        await forkWithOrganization(context, "org2").withContext(async (forkedContext) => {
            const forkedOrganization = await forkedContext.get(Organization);

            console.log(forkedOrganization);
        });

        const organization = await context.get(Organization);

        console.log(organization);
    });
}

main().catch(console.error);
