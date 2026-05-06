import { getCurrentUser } from "@/lib/auth";

export function withUser(handler) {
  return async (request, context) => {
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Neautorizat" }, { status: 401 });
    }
    try {
      return await handler({ request, context, user });
    } catch (err) {
      const status = err?.status || 500;
      const code = err?.code || "INTERNAL";
      const message =
        status >= 500
          ? "Eroare server."
          : err?.message || "Eroare necunoscută.";
      if (status >= 500) console.error("API error:", err);
      return Response.json({ error: message, code }, { status });
    }
  };
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
