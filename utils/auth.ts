import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { configuredAuthURL, configuredOrigin } from "./appPath.mjs";

export const auth = betterAuth({
  baseURL: configuredAuthURL(),
  basePath: "/api/auth",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["http://localhost:3000", configuredOrigin()],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 zile
    updateAge: 60 * 60 * 24, // reînnoire la fiecare zi
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minute cache cookie
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "USER",
        input: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
