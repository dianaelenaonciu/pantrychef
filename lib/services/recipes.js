import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import Recipe from "@/models/Recipe";
import PantryItem from "@/models/PantryItem";
import { generateRecipes } from "@/lib/gemini";
import { ValidationError, NotFoundError } from "@/lib/errors";

const ALLOWED_DIFFICULTY = ["ușor", "mediu", "dificil"];

function serializeSummary(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    timeMinutes: doc.timeMinutes,
    difficulty: doc.difficulty,
    favorite: doc.favorite,
    createdAt: doc.createdAt?.toISOString() ?? null,
  };
}

function serializeFull(doc) {
  return {
    ...serializeSummary(doc),
    ingredients: (doc.ingredients || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
    })),
    steps: doc.steps || [],
    sourcePrompt: doc.sourcePrompt || "",
  };
}

export async function listRecipes(userId) {
  await connectToDatabase();
  const docs = await Recipe.find({ user: userId })
    .sort({ favorite: -1, createdAt: -1 })
    .lean();
  return docs.map(serializeSummary);
}

export async function getRecipe(userId, id) {
  await connectToDatabase();
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new NotFoundError("Rețetă inexistentă.");

  const doc = await Recipe.findOne({ _id: id, user: userId }).lean();
  if (!doc) throw new NotFoundError("Rețetă inexistentă.");
  return serializeFull(doc);
}

export async function saveRecipe(userId, draft) {
  await connectToDatabase();

  if (!draft?.title || typeof draft.title !== "string")
    throw new ValidationError("Titlu obligatoriu.");
  if (!Array.isArray(draft.steps))
    throw new ValidationError("Lista de pași trebuie să fie un array.");

  const difficulty = ALLOWED_DIFFICULTY.includes(draft.difficulty)
    ? draft.difficulty
    : "mediu";

  const doc = await Recipe.create({
    user: userId,
    title: draft.title.slice(0, 200),
    description: String(draft.description || "").slice(0, 1000),
    ingredients: (draft.ingredients || []).slice(0, 50).map((ing) => ({
      name: String(ing?.name || "").slice(0, 100),
      quantity: String(ing?.quantity || "").slice(0, 50),
    })),
    steps: draft.steps.slice(0, 30).map((s) => String(s).slice(0, 1000)),
    timeMinutes: Number.isFinite(Number(draft.timeMinutes))
      ? Number(draft.timeMinutes)
      : null,
    difficulty,
    favorite: false,
    sourcePrompt: String(draft.sourcePrompt || "").slice(0, 2000),
  });

  return serializeFull(doc);
}

export async function deleteRecipe(userId, id) {
  await connectToDatabase();
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new NotFoundError("Rețetă inexistentă.");

  const result = await Recipe.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0)
    throw new NotFoundError("Rețetă inexistentă.");
}

export async function toggleFavorite(userId, id) {
  await connectToDatabase();
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new NotFoundError("Rețetă inexistentă.");

  const doc = await Recipe.findOne({ _id: id, user: userId });
  if (!doc) throw new NotFoundError("Rețetă inexistentă.");
  doc.favorite = !doc.favorite;
  await doc.save();
  return { id: doc._id.toString(), favorite: doc.favorite };
}

export async function generateRecipeDrafts(userId) {
  await connectToDatabase();
  const pantry = await PantryItem.find({ user: userId }).lean();

  if (pantry.length === 0)
    throw new ValidationError("Cămara e goală — adaugă ingrediente întâi.");

  const drafts = await generateRecipes(pantry);
  const sourcePrompt = pantry
    .map((i) => `${i.quantity} ${i.unit} ${i.name}`)
    .join(", ");
  return drafts.map((d) => ({ ...d, sourcePrompt }));
}
