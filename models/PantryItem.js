import mongoose from "mongoose";

const PantryItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 0 },
    unit: {
      type: String,
      enum: ["buc", "g", "kg", "ml", "l", "lingură", "linguriță", "cană"],
      default: "buc",
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

PantryItemSchema.index({ user: 1, name: 1 });

export default mongoose.models.PantryItem ||
  mongoose.model("PantryItem", PantryItemSchema);
