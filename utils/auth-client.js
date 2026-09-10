import { createAuthClient } from "better-auth/react";
import { configuredAuthURL } from "@/utils/appPath";

export const authClient = createAuthClient({
  baseURL: configuredAuthURL(),
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;