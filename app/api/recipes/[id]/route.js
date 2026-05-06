import { withUser, readJson } from "@/lib/api";
import {
  getRecipe,
  deleteRecipe,
  toggleFavorite,
} from "@/lib/services/recipes";

export const GET = withUser(async ({ context, user }) => {
  const { id } = await context.params;
  const recipe = await getRecipe(user._id, id);
  return Response.json({ recipe });
});

export const PATCH = withUser(async ({ request, context, user }) => {
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body || typeof body.favorite !== "boolean") {
    return Response.json(
      {
        error: "Body trebuie să conțină {favorite: boolean}.",
        code: "VALIDATION",
      },
      { status: 400 }
    );
  }
  const result = await toggleFavorite(user._id, id);
  return Response.json({ id: result.id, favorite: result.favorite });
});

export const DELETE = withUser(async ({ context, user }) => {
  const { id } = await context.params;
  await deleteRecipe(user._id, id);
  return new Response(null, { status: 204 });
});
