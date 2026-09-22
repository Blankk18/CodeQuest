// lib/auth.ts
// NextAuth configuration — GitHub OAuth + Email/Password credentials.
// PrismaAdapter writes users/accounts/sessions to PostgreSQL.

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, name: true, email: true, image: true },
        });
        if (!user) return null;

        // NOTE: for credentials sign-up, store hashed password in a separate
        // `passwords` table or use a magic-link flow. For the demo we check a
        // bcrypt hash stored in a hypothetical `password_hash` column.
        // Replace this block with your actual credential logic.
        const ok = await bcrypt.compare(
          credentials.password,
          (user as any).passwordHash ?? ""
        );
        if (!ok) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      // On initial sign-in, hydrate token with user's id
      if (user) {
        token.id    = user.id;
        token.email = user.email ?? token.email;
      }
      // Propagate manual session updates (e.g. after XP change)
      if (trigger === "update" && updateSession) {
        Object.assign(token, updateSession);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },

  events: {
    // Award first-login badge when a new account is created
    async createUser({ user }) {
      await prisma.userBadge
        .create({ data: { userId: user.id, badgeId: "first-login" } })
        .catch(() => {/* already exists */});

      // Initialise skill nodes from the catalogue
      const nodes = await prisma.skillNode.findMany({
        select: { id: true, initialStatus: true },
      });
      await prisma.userSkillNode.createMany({
        data: nodes.map((n) => ({
          userId: user.id,
          nodeId: n.id,
          status: n.initialStatus,
        })),
        skipDuplicates: true,
      });
    },
  },

  pages: {
    signIn: "/auth/signin",
    error:  "/auth/error",
  },
};
