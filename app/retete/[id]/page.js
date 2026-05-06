import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import Recipe from "@/models/Recipe";
import RecipeDetailView from "./RecipeDetailView";
import SignInPrompt from "@/components/SignInPrompt";

export async function generateMetadata({ params }) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { title: "Rețetă — PantryChef" };
  }
  await connectToDatabase();
  const recipe = await Recipe.findById(id).lean();
  return {
    title: recipe ? `${recipe.title} — PantryChef` : "Rețetă — PantryChef",
  };
}

export default async function RetetaDetailPage({ params }) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return <SignInPrompt message="Conectează-te ca să vezi rețeta." />;
  }

  if (!mongoose.Types.ObjectId.isValid(id)) notFound();

  await connectToDatabase();
  const doc = await Recipe.findOne({ _id: id, user: user._id }).lean();
  if (!doc) notFound();

  const recipe = {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    ingredients: (doc.ingredients || []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
    })),
    steps: doc.steps || [],
    timeMinutes: doc.timeMinutes,
    difficulty: doc.difficulty,
    favorite: doc.favorite,
  };

  return <RecipeDetailView recipe={recipe} />;
}
