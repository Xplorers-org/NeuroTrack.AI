import { User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface PatientInformationProps {
  formData: {
    fullName: string
    age: string
    gender: string
    testTime: string
  }
  onFormChange: (field: string, value: string) => void
}

export default function PatientInformation({
  formData,
  onFormChange,
}: PatientInformationProps) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Information
        </h2>
        <p className="text-muted-foreground">Patient basic details</p>
      </div>

      <Card className="bg-secondary/50 border-0 p-6 mb-8 flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Patient Information
          </h3>
          <p className="text-sm text-muted-foreground">
            Please provide basic details for the analysis
          </p>
        </div>
      </Card>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => onFormChange('fullName', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Age <span className="text-destructive">*</span>
            </label>
            <Input
              type="number"
              placeholder="45"
              value={formData.age}
              onChange={(e) => onFormChange('age', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Gender <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => onFormChange('gender', e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Test Time (days) <span className="text-destructive">*</span>
          </label>
          <Input
            type="text"
            placeholder="ex: 1.5 = 1 and half days"
            value={formData.testTime}
            onChange={(e) => onFormChange('testTime', e.target.value)}
          />
        </div>

        <Card className="bg-secondary/50 border-0 p-4">
          <p className="text-sm font-semibold text-foreground mb-1">
            Privacy Notice:
          </p>
          <p className="text-sm text-muted-foreground">
            Your information and voice sample will be securely transmitted to our analysis servers
          </p>
        </Card>
      </div>
    </div>
  )
}
