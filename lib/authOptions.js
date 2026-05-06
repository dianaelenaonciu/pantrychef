import GitHubProvider from "next-auth/providers/github";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false;
      await connectToDatabase();
      await User.findOneAndUpdate(
        { email: user.email },
        {
          $set: {
            name: user.name,
            image: user.image,
            provider: account?.provider,
            providerAccountId: account?.providerAccountId,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: user.email }).lean();
        if (dbUser) token.userId = dbUser._id.toString();
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
};
