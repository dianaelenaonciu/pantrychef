import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-4 tracking-wide uppercase">
              Asistent culinar AI
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-6">
              Gătește din ce ai deja în cămară.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
              Adaugă ingredientele pe care le ai în casă și PantryChef îți
              propune rețete potrivite, generate cu Google Gemini. Salvează-le
              pe cele care îți plac și revino la ele oricând.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/camara"
                className="px-5 py-2.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
              >
                Cămara mea
              </Link>
              <Link
                href="/retete"
                className="px-5 py-2.5 rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
              >
                Rețetele mele
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/5] md:aspect-[3/4] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            <Image
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&q=80&auto=format&fit=crop"
              alt="Ingrediente proaspete pe masa de bucătărie"
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8 tracking-wide uppercase">
            Cum funcționează
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <Step
              n="01"
              title="Adaugă ingrediente"
              text="Spune-i aplicației ce ai în cămară: cantități și unități de măsură."
            />
            <Step
              n="02"
              title="Generează rețete"
              text="Gemini propune trei sugestii adaptate, cu pași clari și timp estimat."
            />
            <Step
              n="03"
              title="Salvează favoritele"
              text="Marchează-le pe cele care îți plac și redescoperă-le oricând."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, text }) {
  return (
    <div>
      <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400 mb-3">
        {n}
      </p>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {text}
      </p>
    </div>
  );
}
