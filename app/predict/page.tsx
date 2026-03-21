'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import PatientInformation from '@/components/predict/patient-information'
import VoiceUpload from '@/components/predict/voice-upload'
import Preview from '@/components/predict/preview'
import Submit from '@/components/predict/submit'
import StepIndicator from '@/components/predict/step-indicator'

interface FormData {
  fullName: string
  age: string
  gender: string
  testTime: string
  voiceFile?: File
  voiceUrl?: string
}

const STEPS = [
  { number: 1, title: 'Information', subtitle: 'Patient basic details' },
  { number: 2, title: 'Upload/Record', subtitle: 'Voice sample' },
  { number: 3, title: 'Preview', subtitle: 'Review your recording' },
  { number: 4, title: 'Submit', subtitle: 'Confirm and analyze' },
]

export default function PredictPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    age: '',
    gender: '',
    testTime: '',
  })

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PatientInformation
            formData={formData}
            onFormChange={handleFormChange}
          />
        )
      case 2:
        return (
          <VoiceUpload
            formData={formData}
            onFormChange={handleFormChange}
          />
        )
      case 3:
        return (
          <Preview
            formData={formData}
          />
        )
      case 4:
        return (
          <Submit
            formData={formData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            UPDRS Prediction
          </h1>
          <p className="text-muted-foreground">
            Analyze voice samples to predict motor UPDRS values
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Form Content */}
        <Card className="mt-8 border border-border">
          <div className="p-8">
            {renderStep()}
          </div>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentStep === STEPS.length}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
