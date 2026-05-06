import mongoose from "mongoose";

const RecipeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    ingredients: [
      {
        name: { type: String, required: true },
        quantity: { type: String },
      },
    ],
    steps: [{ type: String }],
    timeMinutes: { type: Number },
    difficulty: {
      type: String,
      enum: ["ușor", "mediu", "dificil"],
      default: "mediu",
    },
    favorite: { type: Boolean, default: false, index: true },
    sourcePrompt: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Recipe ||
  mongoose.model("Recipe", RecipeSchema);
