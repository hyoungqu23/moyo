import { DishDetailClient } from "./DishDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DishPage({ params }: Props) {
  const { id } = await params;
  return <DishDetailClient dishId={id} />;
}
