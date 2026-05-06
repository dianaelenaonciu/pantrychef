"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { addPantryItem, deletePantryItem, updatePantryItem } from "./actions";

const UNITS = ["buc", "g", "kg", "ml", "l", "lingură", "linguriță", "cană"];

export default function PantryView({ initialItems }) {
  const [addState, addAction, isAdding] = useActionState(addPantryItem, null);
  const formRef = useRef(null);

  useEffect(() => {
    if (addState?.ok) formRef.current?.reset();
  }, [addState]);

  return (
    <main className="flex-1">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2 tracking-wide uppercase">
            Cămară
          </p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Ingredientele mele
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Adaugă ce ai în casă. Pe baza listei se generează rețetele.
          </p>
        </header>

        <form
          ref={formRef}
          action={addAction}
          className="grid grid-cols-[1fr_5rem_8rem_auto] gap-2 mb-3"
        >
          <input
            name="name"
            placeholder="ex. roșii"
            required
            maxLength={80}
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
          <input
            name="quantity"
            type="number"
            min="0.1"
            step="0.1"
            defaultValue="1"
            required
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          />
          <select
            name="unit"
            defaultValue="buc"
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isAdding}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {isAdding ? "..." : "Adaugă"}
          </button>
        </form>

        {addState?.error && (
          <p className="text-red-600 text-sm mb-4">{addState.error}</p>
        )}

        {initialItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 text-left text-xs uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2.5 px-4 font-medium">Ingredient</th>
                  <th className="py-2.5 px-4 font-medium">Cantitate</th>
                  <th className="py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {initialItems.map((item, i) => (
                  <PantryRow
                    key={item.id}
                    item={item}
                    isLast={i === initialItems.length - 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function PantryRow({ item, isLast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const borderClass = isLast
    ? ""
    : "border-b border-zinc-100 dark:border-zinc-900";

  if (isEditing) {
    return (
      <EditRow
        item={item}
        borderClass={borderClass}
        onCancel={() => {
          setError(null);
          setIsEditing(false);
        }}
        onSave={(formData) => {
          setError(null);
          startTransition(async () => {
            const r = await updatePantryItem(item.id, formData);
            if (r.ok) setIsEditing(false);
            else setError(r.error);
          });
        }}
        isPending={isPending}
        error={error}
      />
    );
  }

  return (
    <tr className={borderClass}>
      <td className="py-3 px-4 font-medium">{item.name}</td>
      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 tabular-nums">
        {item.quantity} {item.unit}
      </td>
      <td className="py-3 px-4 text-right text-sm">
        <button
          onClick={() => setIsEditing(true)}
          disabled={isPending}
          className="text-emerald-700 dark:text-emerald-400 hover:underline mr-4 disabled:opacity-50"
        >
          editează
        </button>
        <button
          onClick={() =>
            startTransition(async () => {
              await deletePantryItem(item.id);
            })
          }
          disabled={isPending}
          className="text-red-600 hover:underline disabled:opacity-50"
        >
          {isPending ? "..." : "șterge"}
        </button>
      </td>
    </tr>
  );
}

function EditRow({ item, borderClass, onCancel, onSave, isPending, error }) {
  const ref = useRef(null);

  return (
    <tr className={`bg-zinc-50 dark:bg-zinc-950 ${borderClass}`}>
      <td colSpan={3} className="py-3 px-4">
        <form
          ref={ref}
          onSubmit={(e) => {
            e.preventDefault();
            onSave(new FormData(ref.current));
          }}
          className="grid grid-cols-[1fr_5rem_8rem_auto_auto] gap-2 items-center"
        >
          <input
            name="name"
            defaultValue={item.name}
            required
            maxLength={80}
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
          />
          <input
            name="quantity"
            type="number"
            min="0.1"
            step="0.1"
            defaultValue={item.quantity}
            required
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
          />
          <select
            name="unit"
            defaultValue={item.unit}
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? "..." : "salvează"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
          >
            anulează
          </button>
          {error && (
            <span className="text-red-600 text-xs col-span-full">{error}</span>
          )}
        </form>
      </td>
    </tr>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-16 px-6 text-center">
      <p className="text-zinc-500 dark:text-zinc-400 mb-1">
        Cămara ta e goală.
      </p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        Adaugă primul ingredient folosind formularul de mai sus.
      </p>
    </div>
  );
}
