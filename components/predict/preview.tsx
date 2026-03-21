import { CheckCircle2, User, Mic } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface PreviewProps {
  formData: {
    fullName: string
    age: string
    gender: string
    testTime: string
    voiceFile?: File
  }
}

export default function Preview({ formData }: PreviewProps) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Preview
        </h2>
        <p className="text-muted-foreground">Review your recording and information</p>
      </div>

      <div className="space-y-6">
        {/* Patient Information Summary */}
        <Card className="border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Patient Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Full Name</p>
              <p className="font-medium text-foreground">{formData.fullName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Age</p>
              <p className="font-medium text-foreground">{formData.age || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Gender</p>
              <p className="font-medium text-foreground">{formData.gender || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Test Time (days)</p>
              <p className="font-medium text-foreground">{formData.testTime || '-'}</p>
            </div>
          </div>
        </Card>

        {/* Voice Sample Summary */}
        <Card className="border border-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Voice Sample</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">File</p>
              {formData.voiceFile ? (
                <>
                  <p className="font-medium text-foreground">{formData.voiceFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(formData.voiceFile.size / 1024).toFixed(2)} KB
                  </p>
                </>
              ) : (
                <p className="font-medium text-muted-foreground">No file selected</p>
              )}
            </div>
            {formData.voiceFile && (
              <CheckCircle2 className="w-6 h-6 text-primary" />
            )}
          </div>
        </Card>

        {/* Summary Message */}
        <Card className="bg-primary/5 border border-primary/20 p-6">
          <p className="text-sm text-foreground">
            Review the information above to ensure everything is correct before proceeding to submit for analysis.
          </p>
        </Card>
      </div>
    </div>
  )
}
