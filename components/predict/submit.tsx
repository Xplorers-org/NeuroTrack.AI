'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface SubmitProps {
  formData: {
    fullName: string
    age: string
    gender: string
    testTime: string
    voiceFile?: File
  }
}

export default function Submit({ formData }: SubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSubmitting(false)
    setIsCompleted(true)
  }

  if (isCompleted) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-6">
          <div className="bg-primary/10 p-4 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Submission Successful
        </h2>
        <p className="text-muted-foreground mb-8">
          Your voice sample has been submitted for analysis. You will receive results shortly.
        </p>
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Return to Home
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Confirm and Submit
        </h2>
        <p className="text-muted-foreground">Ready to analyze your voice sample</p>
      </div>

      <div className="space-y-6">
        {/* Submission Summary */}
        <Card className="border border-border p-6">
          <h3 className="font-semibold text-foreground mb-4">
            Submission Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Patient</span>
              <span className="font-medium text-foreground">{formData.fullName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Age</span>
              <span className="font-medium text-foreground">{formData.age} years</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Gender</span>
              <span className="font-medium text-foreground">{formData.gender}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Voice Sample</span>
              <span className="font-medium text-foreground">
                {formData.voiceFile ? 'Uploaded' : 'Pending'}
              </span>
            </div>
          </div>
        </Card>

        {/* Terms and Conditions */}
        <Card className="bg-secondary/50 border-0 p-6">
          <h4 className="font-semibold text-foreground mb-3">
            Acknowledgment
          </h4>
          <div className="space-y-2 text-sm text-foreground">
            <p>✓ I confirm all patient information is accurate</p>
            <p>✓ The voice sample is from the stated patient</p>
            <p>✓ I consent to analyze this data for UPDRS prediction</p>
            <p>✓ I understand the results are for informational purposes only</p>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.voiceFile}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 py-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit for Analysis'
          )}
        </Button>

        {!formData.voiceFile && (
          <p className="text-sm text-destructive text-center">
            Please upload or record a voice sample before submitting
          </p>
        )}
      </div>
    </div>
  )
}
