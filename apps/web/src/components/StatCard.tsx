export const StatCard = ({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "warn" | "accent";
}) => {
  const toneClass =
    tone === "warn"
      ? "from-amber-50 to-orange-50 border-orange-200"
      : tone === "accent"
        ? "from-cyan-50 to-blue-50 border-cyan-200"
        : "from-slate-50 to-white border-slate-200";

  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${toneClass} p-4`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
};
