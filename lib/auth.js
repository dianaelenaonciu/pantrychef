import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email }).lean();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    err.code = "UNAUTHORIZED";
    throw err;
  }
  return user;
}
