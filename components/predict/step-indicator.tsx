interface Step {
  number: number
  title: string
  subtitle: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-between items-start gap-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                currentStep >= step.number
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.number}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm">
                {step.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {step.subtitle}
              </p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-1 mt-2 rounded transition-colors ${
                currentStep > step.number
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
