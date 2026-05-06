"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import * as PantryService from "@/lib/services/pantry";

export async function addPantryItem(_prevState, formData) {
  const user = await requireUser();
  try {
    await PantryService.addPantryItem(user._id, {
      name: formData.get("name"),
      quantity: formData.get("quantity"),
      unit: formData.get("unit"),
    });
    revalidatePath("/camara");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Eroare la adăugare." };
  }
}

export async function updatePantryItem(id, formData) {
  const user = await requireUser();
  try {
    await PantryService.updatePantryItem(user._id, id, {
      name: formData.get("name"),
      quantity: formData.get("quantity"),
      unit: formData.get("unit"),
    });
    revalidatePath("/camara");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Eroare la actualizare." };
  }
}

export async function deletePantryItem(id) {
  const user = await requireUser();
  try {
    await PantryService.deletePantryItem(user._id, id);
    revalidatePath("/camara");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || "Eroare la ștergere." };
  }
}
