import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import PantryItem from "@/models/PantryItem";
import { ValidationError, NotFoundError } from "@/lib/errors";

export const ALLOWED_UNITS = [
  "buc",
  "g",
  "kg",
  "ml",
  "l",
  "lingură",
  "linguriță",
  "cană",
];

function serialize(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    quantity: doc.quantity,
    unit: doc.unit,
    createdAt: doc.createdAt?.toISOString() ?? null,
  };
}

export async function listPantryItems(userId) {
  await connectToDatabase();
  const docs = await PantryItem.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map(serialize);
}

export async function countPantryItems(userId) {
  await connectToDatabase();
  return PantryItem.countDocuments({ user: userId });
}

export async function addPantryItem(userId, input) {
  await connectToDatabase();

  const name = String(input?.name || "").trim();
  const quantity = Number(input?.quantity ?? 1);
  const unit = String(input?.unit || "buc");

  if (!name) throw new ValidationError("Numele e obligatoriu.");
  if (name.length > 80) throw new ValidationError("Nume prea lung (max 80 caractere).");
  if (!Number.isFinite(quantity) || quantity <= 0)
    throw new ValidationError("Cantitatea trebuie să fie un număr pozitiv.");
  if (!ALLOWED_UNITS.includes(unit))
    throw new ValidationError(
      `Unitate necunoscută. Permise: ${ALLOWED_UNITS.join(", ")}.`
    );

  const doc = await PantryItem.create({ user: userId, name, quantity, unit });
  return serialize(doc);
}

export async function updatePantryItem(userId, id, input) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ValidationError("ID invalid.");

  const update = {};

  if (input?.name !== undefined) {
    const name = String(input.name).trim();
    if (!name) throw new ValidationError("Numele e obligatoriu.");
    if (name.length > 80)
      throw new ValidationError("Nume prea lung (max 80 caractere).");
    update.name = name;
  }

  if (input?.quantity !== undefined) {
    const quantity = Number(input.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new ValidationError("Cantitatea trebuie să fie un număr pozitiv.");
    update.quantity = quantity;
  }

  if (input?.unit !== undefined) {
    if (!ALLOWED_UNITS.includes(input.unit))
      throw new ValidationError(
        `Unitate necunoscută. Permise: ${ALLOWED_UNITS.join(", ")}.`
      );
    update.unit = input.unit;
  }

  if (Object.keys(update).length === 0)
    throw new ValidationError("Nu ai trimis niciun câmp de actualizat.");

  const doc = await PantryItem.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: update },
    { new: true }
  );
  if (!doc) throw new NotFoundError("Ingredient inexistent.");
  return serialize(doc);
}

export async function deletePantryItem(userId, id) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ValidationError("ID invalid.");

  const result = await PantryItem.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0)
    throw new NotFoundError("Ingredient inexistent.");
}
