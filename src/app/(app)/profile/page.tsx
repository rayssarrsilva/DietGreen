import { redirect } from "next/navigation";
import { auth } from "@/infrastructure/auth/auth";
import { ProfileContent } from "@/components/profile/ProfileContent";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <ProfileContent />;
}
