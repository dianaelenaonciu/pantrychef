import { withUser } from "@/lib/api";
import { generateRecipeDrafts } from "@/lib/services/recipes";

export const POST = withUser(async ({ user }) => {
  const drafts = await generateRecipeDrafts(user._id);
  return Response.json({ drafts });
});
