import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "cp_modo_teste";

export async function isTestModeActive(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "1";
}

export async function setTestModeCookie(active: boolean) {
  const store = await cookies();
  store.set(COOKIE_NAME, active ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
