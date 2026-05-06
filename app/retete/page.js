import { connectToDatabase } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import Recipe from "@/models/Recipe";
import PantryItem from "@/models/PantryItem";
import RecipesView from "./RecipesView";
import SignInPrompt from "@/components/SignInPrompt";

export const metadata = {
  title: "Rețetele mele — PantryChef",
};

export default async function ReteteListPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <SignInPrompt message="Conectează-te ca să vezi rețetele tale." />
    );
  }

  await connectToDatabase();

  const [docs, pantryCount] = await Promise.all([
    Recipe.find({ user: user._id })
      .sort({ favorite: -1, createdAt: -1 })
      .lean(),
    PantryItem.countDocuments({ user: user._id }),
  ]);

  const recipes = docs.map((d) => ({
    id: d._id.toString(),
    title: d.title,
    description: d.description,
    timeMinutes: d.timeMinutes,
    difficulty: d.difficulty,
    favorite: d.favorite,
    createdAt: d.createdAt?.toISOString() ?? null,
  }));

  return <RecipesView recipes={recipes} pantryCount={pantryCount} />;
}
