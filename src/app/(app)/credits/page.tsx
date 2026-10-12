import { auth } from "@/infrastructure/auth/auth";
import { CreditsPage } from "@/components/billing/CreditsPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  return <CreditsPage isSignedIn={Boolean(session?.user)} />;
}
