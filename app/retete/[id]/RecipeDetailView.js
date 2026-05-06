"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleFavorite, deleteRecipe } from "../actions";

export default function RecipeDetailView({ recipe }) {
  const [favorite, setFavorite] = useState(recipe.favorite);
  const [isToggling, startToggling] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const handleFav = () => {
    startToggling(async () => {
      const r = await toggleFavorite(recipe.id);
      if (r.ok) setFavorite(r.favorite);
    });
  };

  const handleDelete = () => {
    if (!confirm(`Ștergi rețeta „${recipe.title}"?`)) return;
    startDeleting(async () => {
      await deleteRecipe(recipe.id);
    });
  };

  return (
    <main className="flex-1">
      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link
          href="/retete"
          className="text-sm text-zinc-500 hover:text-emerald-700 dark:hover:text-emerald-400 mb-8 inline-block"
        >
          ← Înapoi la rețete
        </Link>

        <header className="mb-10 pb-8 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 leading-tight">
            {recipe.title}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
            {recipe.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-5 text-sm">
            {recipe.timeMinutes ? (
              <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 tabular-nums">
                {recipe.timeMinutes} min
              </span>
            ) : null}
            <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300">
              {recipe.difficulty}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleFav}
              disabled={isToggling}
              className={`px-4 py-2 rounded-md text-sm font-medium border transition disabled:opacity-60 ${
                favorite
                  ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
                  : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              {favorite ? "♥ Favorită" : "♡ Adaugă la favorite"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-md text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-200 dark:hover:border-red-900 transition disabled:opacity-60"
            >
              {isDeleting ? "..." : "Șterge"}
            </button>
          </div>
        </header>

        <section className="mb-10">
          <h2 className="text-xs font-medium text-zinc-500 mb-4 tracking-wide uppercase">
            Ingrediente
          </h2>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li
                key={i}
                className="flex justify-between gap-3 py-1.5 border-b border-zinc-100 dark:border-zinc-900"
              >
                <span>{ing.name}</span>
                <span className="text-zinc-500 tabular-nums">
                  {ing.quantity}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xs font-medium text-zinc-500 mb-4 tracking-wide uppercase">
            Pași
          </h2>
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-center text-sm tabular-nums">
                  {i + 1}
                </span>
                <p className="leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </article>
    </main>
  );
}
