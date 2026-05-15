import { RecipeDetailClient } from "./RecipeDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params;
  return <RecipeDetailClient recipeId={id} />;
}
