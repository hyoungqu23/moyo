import { redirect } from "next/navigation";

import { HomeClient } from "./HomeClient";
import { UnauthenticatedError, requireAuth } from "@/lib/auth";

export default async function HomePage() {
  try {
    await requireAuth();
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect("/sign-in");
    }
    throw err;
  }
  return <HomeClient />;
}
