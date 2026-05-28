type DogfoodingProgressBarProps = {
  percentage: number;
};

export function DogfoodingProgressBar({
  percentage,
}: DogfoodingProgressBarProps) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-slate-900 transition-[width]"
        style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
      />
    </div>
  );
}
