import { withUser, readJson } from "@/lib/api";
import { listRecipes, saveRecipe } from "@/lib/services/recipes";

export const GET = withUser(async ({ user }) => {
  const recipes = await listRecipes(user._id);
  return Response.json({ recipes });
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request);
  if (!body) {
    return Response.json(
      { error: "Body JSON invalid.", code: "VALIDATION" },
      { status: 400 }
    );
  }
  const recipe = await saveRecipe(user._id, body);
  return Response.json({ recipe }, { status: 201 });
});
