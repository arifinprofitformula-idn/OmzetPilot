import { DogfoodingProgressBar } from "@/src/components/admin/DogfoodingProgressBar";
import type { DogfoodingFunnelStep } from "@/src/lib/adminDogfooding";

type DogfoodingFunnelCardProps = {
  step: DogfoodingFunnelStep;
};

export function DogfoodingFunnelCard({ step }: DogfoodingFunnelCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{step.label}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-slate-950">
          {step.count}
        </p>
        <p className="text-sm font-medium text-slate-500">{step.percentage}%</p>
      </div>
      <div className="mt-4">
        <DogfoodingProgressBar percentage={step.percentage} />
      </div>
    </div>
  );
}
