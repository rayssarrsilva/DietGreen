import { auth, signOut } from "@/infrastructure/auth/auth";
import { Header } from "@/components/layout/Header";
import { HomeContent } from "@/components/home/HomeContent";
import { Footer } from "@/components/layout/Footer";

export default async function HomePage() {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <>
      <Header isSignedIn={Boolean(session?.user)} onSignOut={handleSignOut} />
      <HomeContent />
      <Footer />
    </>
  );
}
