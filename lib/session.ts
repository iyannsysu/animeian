import { getServerSession } from "next-auth/next";
import { authOptions, hashEmailId } from "@/lib/auth";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!session?.user || !email) return null;
  const id = (session.user as { id?: string }).id ?? hashEmailId(email);
  return {
    id,
    email,
    name: session.user.name ?? email.split("@")[0],
    image: session.user.image ?? null,
  };
}
