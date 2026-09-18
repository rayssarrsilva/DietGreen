import { auth, signOut } from "@/infrastructure/auth/auth";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <>
      <Header isSignedIn={Boolean(session?.user)} onSignOut={handleSignOut} />
      <div className="flex-1 flex flex-col">{children}</div>
    </>
  );
}
