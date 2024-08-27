import { cachedEntry, Context, ContextBuilder } from "@hollymoon/context";

function isUserInOrganization(user: string, organization: string) {
    return user.startsWith(organization + "-");
}

function Authentication(context: Context) {
    console.log("Authentication built");
    return {
        token: "org1-user1",
        organization: "org1",
        user: "org1-user1",
    };
}

async function User(context: Context) {
    const authentication = await context.get(Authentication);

    console.log("User built");

    return authentication.user;
}

async function Organization(context: Context) {
    const authentication = await context.get(Authentication);
    const user = await context.get(User);

    if (!isUserInOrganization(user, authentication.organization)) {
        throw new Error("User is not in organization");
    }

    console.log("Organization built");

    return authentication.organization;
}

const builder = new ContextBuilder()
    .add(cachedEntry(Authentication))
    .add(cachedEntry(User))
    .add(cachedEntry(Organization));

async function printUser(context: Context) {
    const user = await context.get(User);

    console.log(user);
}

async function printOrganization(context: Context) {
    const organization = await context.get(Organization);

    console.log(organization);
}

builder.withContext(async (context) => {
    await printUser(context);
    await printOrganization(context);
});
