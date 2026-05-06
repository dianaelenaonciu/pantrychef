"use client";

import { signIn } from "next-auth/react";
import { ChefHat } from "lucide-react";

export default function SignInPrompt({ message }) {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center mx-auto mb-5">
          <ChefHat className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Trebuie să te conectezi</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          {message || "Conectează-te ca să continui."}
        </p>
        <button
          onClick={() => signIn("github")}
          className="px-5 py-2.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
        >
          Login cu GitHub
        </button>
      </div>
    </main>
  );
}
