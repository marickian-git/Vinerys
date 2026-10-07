import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";
import { configuredAuthURL, configuredOrigin } from "./appPath.mjs";

export const auth = betterAuth({
  baseURL: configuredAuthURL(),
  basePath: "/api/auth",
  plugins: [nextCookies()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: ["http://localhost:3000", configuredOrigin()],
  // SEC-009: limite stricte pe endpointurile sensibile (în memorie, o singură instanță)
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
      "/change-password": { window: 10 * 60, max: 5 },
      "/request-password-reset": { window: 60 * 60, max: 3 },
      "/reset-password": { window: 10 * 60, max: 5 },
    },
  },
  advanced: {
    // În spatele reverse proxy-ului IP-ul real vine din headere. x-real-ip (setat de proxy) e preferat:
    // x-forwarded-for poate fi falsificat de client dacă proxy-ul îl concatenează în loc să-l suprascrie
    ipAddress: { ipAddressHeaders: ["x-real-ip", "x-forwarded-for"] },
  },
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
