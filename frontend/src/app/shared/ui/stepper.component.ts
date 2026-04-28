import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

interface StepItem {
  id: number;
  label: string;
}

@Component({
  selector: 'ui-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid gap-3 md:grid-cols-3">
      @for (step of steps(); track step.id) {
        <div
          class="rounded-2xl border px-4 py-3"
          [class.border-cyan-300]="currentStep() === step.id"
          [class.bg-cyan-50]="currentStep() === step.id"
          [class.border-emerald-200]="currentStep() > step.id"
          [class.bg-emerald-50]="currentStep() > step.id"
          [class.border-slate-200]="currentStep() < step.id"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Paso {{ step.id }}</p>
          <p class="mt-1 font-semibold text-slate-950">{{ step.label }}</p>
        </div>
      }
    </div>
  `,
})
export class StepperComponent {
  readonly steps = input.required<StepItem[]>();
  readonly currentStep = input.required<number>();
}
