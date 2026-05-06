"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { ChefHat } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-xl"
        >
          <ChefHat className="w-7 h-7 text-emerald-600" />
          <span>PantryChef</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {session?.user && (
            <>
              <Link href="/camara" className="hover:underline">
                Cămară
              </Link>
              <Link href="/retete" className="hover:underline">
                Rețete
              </Link>
            </>
          )}

          {loading ? (
            <span className="text-zinc-400">...</span>
          ) : session?.user ? (
            <>
              <span className="text-zinc-500 hidden sm:inline">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Ieși
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("github")}
              className="px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Login GitHub
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
