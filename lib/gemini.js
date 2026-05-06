import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Lipsește GEMINI_API_KEY din .env.local");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const recipesSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING, description: "Titlul rețetei" },
      description: {
        type: SchemaType.STRING,
        description: "Scurtă descriere, 1-2 propoziții",
      },
      ingredients: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            quantity: { type: SchemaType.STRING },
          },
          required: ["name", "quantity"],
        },
      },
      steps: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: "Pașii de pregătire, în ordine",
      },
      timeMinutes: {
        type: SchemaType.INTEGER,
        description: "Timp total estimat în minute",
      },
      difficulty: {
        type: SchemaType.STRING,
        enum: ["ușor", "mediu", "dificil"],
        format: "enum",
      },
    },
    required: [
      "title",
      "description",
      "ingredients",
      "steps",
      "timeMinutes",
      "difficulty",
    ],
  },
};

const genAI = new GoogleGenerativeAI(apiKey);

export async function generateRecipes(pantryItems) {
  const ingredientsList = pantryItems
    .map((i) => `${i.quantity} ${i.unit} ${i.name}`)
    .join(", ");

  const prompt = `Ești un chef care propune rețete fezabile pe baza ingredientelor disponibile.

Ingrediente disponibile în cămara utilizatorului: ${ingredientsList}.

Generează exact 3 rețete diferite în limba română. Reguli:
- Folosește în principal ingredientele de mai sus. Poți presupune că utilizatorul are sare, piper, ulei și apă.
- Nu inventa ingrediente exotice care nu se găsesc ușor în România.
- Pașii trebuie să fie clari, în ordine, fiecare o singură acțiune.
- Difficulty: "ușor" pentru sub 20 min și fără tehnici speciale, "mediu" pentru 20-45 min, "dificil" pentru peste 45 min sau tehnici complexe.
- Răspunde DOAR cu JSON valid conform schemei.`;

  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: recipesSchema,
      temperature: 0.8,
    },
  });

  let text;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    throw geminiError(err?.status, err);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw geminiError("PARSE");
  }
  if (!Array.isArray(parsed)) throw geminiError("PARSE");
  return parsed;
}

function geminiError(statusOrCode, original) {
  let code, status;
  if (statusOrCode === 429) (code = "QUOTA"), (status = 429);
  else if (statusOrCode === 401 || statusOrCode === 403)
    (code = "AUTH"), (status = statusOrCode);
  else if (typeof statusOrCode === "number" && statusOrCode >= 500)
    (code = "UPSTREAM"), (status = 502);
  else if (statusOrCode === "PARSE") (code = "PARSE"), (status = 502);
  else (code = "NETWORK"), (status = 502);

  const messages = {
    QUOTA: `Limita Gemini atinsă pentru modelul „${MODEL}". Schimbă GEMINI_MODEL în .env.local (ex. gemini-2.5-flash, gemini-flash-latest) sau activează billing-ul în Google AI Studio.`,
    AUTH: "Cheia GEMINI_API_KEY pare invalidă sau fără acces la modelul ales.",
    UPSTREAM: "Gemini are probleme momentan. Încearcă peste câteva minute.",
    PARSE: "Gemini a întors un răspuns pe care nu-l pot citi. Încearcă din nou.",
    NETWORK:
      "Problemă de rețea către Gemini. Verifică conexiunea și încearcă din nou.",
  };

  const e = new Error(messages[code]);
  e.code = code;
  e.status = status;
  e.model = MODEL;
  if (original) e.cause = original;
  return e;
}
