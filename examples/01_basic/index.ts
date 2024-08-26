import { cachedEntry, Context, ContextBuilder } from "@hollymoon/context";

function MyEntry(context: Context) {
    console.log("MyEntry built");

    return {
        print: async () => {
            console.log("Hello, World!");
        },
    };
}

const builder = new ContextBuilder(cachedEntry(MyEntry));

builder.withContext(async (context) => {
    (await context.get(MyEntry)).print();
    (await context.get(MyEntry)).print();
});
