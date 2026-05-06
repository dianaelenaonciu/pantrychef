"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { generateRecipeDrafts, saveRecipe } from "./actions";

export default function RecipesView({ recipes, pantryCount }) {
  const [tab, setTab] = useState("toate");
  const [drafts, setDrafts] = useState([]);
  const [genError, setGenError] = useState(null);
  const [isGenerating, startGenerating] = useTransition();

  const filtered =
    tab === "favorite" ? recipes.filter((r) => r.favorite) : recipes;

  const handleGenerate = () => {
    setGenError(null);
    startGenerating(async () => {
      const r = await generateRecipeDrafts();
      if (r.ok) setDrafts(r.drafts);
      else setGenError(r.error);
    });
  };

  return (
    <main className="flex-1">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2 tracking-wide uppercase">
            Rețete
          </p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight mb-2">
                Rețetele mele
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {pantryCount === 0
                  ? "Adaugă ingrediente în cămară ca să poți genera rețete."
                  : `Ai ${pantryCount} ${pantryCount === 1 ? "ingredient" : "ingrediente"} în cămară.`}
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || pantryCount === 0}
              className="px-5 py-2.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {isGenerating ? "Generez..." : "Generează rețete"}
            </button>
          </div>
        </header>

        {genError && (
          <p className="text-red-600 text-sm mb-4">{genError}</p>
        )}

        {drafts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xs font-medium text-zinc-500 mb-3 tracking-wide uppercase">
              Sugestii noi
            </h2>
            <div className="space-y-3">
              {drafts.map((d, i) => (
                <DraftCard
                  key={i}
                  draft={d}
                  onSaved={() =>
                    setDrafts((arr) => arr.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>
          </section>
        )}

        <div className="border-b border-zinc-200 dark:border-zinc-800 mb-4 flex gap-6 text-sm">
          <TabBtn active={tab === "toate"} onClick={() => setTab("toate")}>
            Toate ({recipes.length})
          </TabBtn>
          <TabBtn
            active={tab === "favorite"}
            onClick={() => setTab("favorite")}
          >
            Favorite ({recipes.filter((r) => r.favorite).length})
          </TabBtn>
        </div>

        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {filtered.map((r) => (
              <RecipeRow key={r.id} recipe={r} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2.5 -mb-px border-b-2 transition ${
        active
          ? "border-emerald-600 font-medium text-emerald-700 dark:text-emerald-400"
          : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function DraftCard({ draft, onSaved }) {
  const [isSaving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startSaving(async () => {
      const r = await saveRecipe(draft);
      if (r.ok) {
        setSaved(true);
        setTimeout(onSaved, 600);
      }
    });
  };

  return (
    <article className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 bg-white dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold leading-tight">{draft.title}</h3>
        <button
          onClick={handleSave}
          disabled={isSaving || saved}
          className="shrink-0 text-sm px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition disabled:opacity-60"
        >
          {saved ? "✓ Salvată" : isSaving ? "..." : "Salvează"}
        </button>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
        {draft.description}
      </p>
      <p className="text-xs text-zinc-500 mb-3 tabular-nums">
        {draft.timeMinutes} min · {draft.difficulty}
      </p>
      <details className="text-sm">
        <summary className="cursor-pointer text-emerald-700 dark:text-emerald-400 hover:underline select-none">
          Vezi pașii ({draft.steps?.length || 0})
        </summary>
        <ol className="list-decimal pl-5 mt-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          {draft.steps?.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </details>
    </article>
  );
}

function RecipeRow({ recipe }) {
  return (
    <li>
      <Link
        href={`/retete/${recipe.id}`}
        className="block py-4 hover:bg-zinc-50 dark:hover:bg-zinc-950 -mx-3 px-3 rounded-md transition"
      >
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium">{recipe.title}</h3>
          {recipe.favorite && <span className="text-red-500">♥</span>}
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
          {recipe.description}
        </p>
        <p className="text-xs text-zinc-500 mt-1.5 tabular-nums">
          {recipe.timeMinutes ? `${recipe.timeMinutes} min · ` : ""}
          {recipe.difficulty}
        </p>
      </Link>
    </li>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-16 px-6 text-center">
      <p className="text-zinc-500 dark:text-zinc-400">
        {tab === "favorite"
          ? "Nicio rețetă favorită încă. Marchează cu ♥ rețetele care îți plac."
          : 'Nu ai rețete salvate. Apasă „Generează rețete".'}
      </p>
    </div>
  );
}
