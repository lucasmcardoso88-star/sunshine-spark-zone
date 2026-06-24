export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6 border-b border-border/70 pb-5">
      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
