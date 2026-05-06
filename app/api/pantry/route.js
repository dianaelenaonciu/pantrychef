import { withUser, readJson } from "@/lib/api";
import {
  listPantryItems,
  addPantryItem,
} from "@/lib/services/pantry";

export const GET = withUser(async ({ user }) => {
  const items = await listPantryItems(user._id);
  return Response.json({ items });
});

export const POST = withUser(async ({ request, user }) => {
  const body = await readJson(request);
  if (!body) {
    return Response.json(
      { error: "Body JSON invalid.", code: "VALIDATION" },
      { status: 400 }
    );
  }
  const item = await addPantryItem(user._id, body);
  return Response.json({ item }, { status: 201 });
});
