import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";

const mongoose = await connectToDatabase();
const client = mongoose.connection.getClient();
const db = client.db();

if (!db) {
    throw new Error("MongoDB connection not found");
}

const appBaseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "";
const trustedOrigins = [
    appBaseURL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    "http://localhost:3000",
]
    .filter((origin): origin is string => Boolean(origin))
    .map((origin) => origin.replace(/\/$/, ""));

export const auth = betterAuth({
    database: mongodbAdapter(db, { client }),
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: appBaseURL,
    trustedOrigins,
    user: {
        additionalFields: {
            phoneNumber: {
                type: "string",
                required: false,
                input: true,
                returned: true,
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        disableSignUp: false,
        requireEmailVerification: false,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    plugins: [
        nextCookies(),
    ],
});
