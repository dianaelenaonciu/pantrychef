"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import * as RecipeService from "@/lib/services/recipes";

export async function generateRecipeDrafts() {
  const user = await requireUser();
  try {
    const drafts = await RecipeService.generateRecipeDrafts(user._id);
    return { ok: true, drafts };
  } catch (err) {
    console.error("generateRecipeDrafts:", err);
    return { ok: false, error: err.message || "Nu am putut genera rețete." };
  }
}

export async function saveRecipe(draft) {
  const user = await requireUser();
  try {
    const recipe = await RecipeService.saveRecipe(user._id, draft);
    revalidatePath("/retete");
    return { ok: true, id: recipe.id };
  } catch (err) {
    return { ok: false, error: err.message || "Eroare la salvare." };
  }
}

export async function toggleFavorite(id) {
  const user = await requireUser();
  try {
    const result = await RecipeService.toggleFavorite(user._id, id);
    revalidatePath("/retete");
    revalidatePath(`/retete/${id}`);
    return { ok: true, favorite: result.favorite };
  } catch (err) {
    return { ok: false, error: err.message || "Eroare." };
  }
}

export async function deleteRecipe(id) {
  const user = await requireUser();
  await RecipeService.deleteRecipe(user._id, id);
  revalidatePath("/retete");
  redirect("/retete");
}
