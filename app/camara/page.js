import { connectToDatabase } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/auth";
import PantryItem from "@/models/PantryItem";
import PantryView from "./PantryView";
import SignInPrompt from "@/components/SignInPrompt";

export const metadata = {
  title: "Cămara mea — PantryChef",
};

export default async function CamaraPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <SignInPrompt message="Conectează-te ca să-ți gestionezi cămara." />
    );
  }

  await connectToDatabase();
  const docs = await PantryItem.find({ user: user._id })
    .sort({ createdAt: -1 })
    .lean();

  const items = docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    quantity: d.quantity,
    unit: d.unit,
    createdAt: d.createdAt?.toISOString() ?? null,
  }));

  return <PantryView initialItems={items} />;
}
