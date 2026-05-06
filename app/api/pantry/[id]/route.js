import { withUser, readJson } from "@/lib/api";
import {
  deletePantryItem,
  updatePantryItem,
} from "@/lib/services/pantry";

export const PATCH = withUser(async ({ request, context, user }) => {
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body) {
    return Response.json(
      { error: "Body JSON invalid.", code: "VALIDATION" },
      { status: 400 }
    );
  }
  const item = await updatePantryItem(user._id, id, body);
  return Response.json({ item });
});

export const DELETE = withUser(async ({ context, user }) => {
  const { id } = await context.params;
  await deletePantryItem(user._id, id);
  return new Response(null, { status: 204 });
});
