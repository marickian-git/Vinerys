import { createAuthClient } from "better-auth/react";
import { appPath, configuredAuthURL } from "@/utils/appPath";

const authURL = typeof window === "undefined"
  ? configuredAuthURL()
  : `${window.location.origin}${appPath("/api/auth")}`;

export const authClient = createAuthClient({
  baseURL: authURL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;