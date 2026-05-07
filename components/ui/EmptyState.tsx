import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-5 bg-parchment px-8 py-20 text-center">
      <h2 className="text-[21px] font-semibold leading-[1.19]">{title}</h2>
      {action ? (
        <a href={action.href}>
          <Button>{action.label}</Button>
        </a>
      ) : null}
    </div>
  );
}
