'use client'

import { useState, useRef } from 'react'
import { Mic, Upload, Play, Pause, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface VoiceUploadProps {
  formData: {
    voiceFile?: File
    voiceUrl?: string
  }
  onFormChange: (field: string, value: any) => void
}

export default function VoiceUpload({ formData, onFormChange }: VoiceUploadProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const audioChunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        const url = URL.createObjectURL(audioBlob)
        setRecordedUrl(url)
        onFormChange('voiceFile', new File([audioBlob], 'recording.wav', { type: 'audio/wav' }))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setRecordedUrl(url)
      onFormChange('voiceFile', file)
    }
  }

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const clearRecording = () => {
    setRecordedUrl(null)
    onFormChange('voiceFile', undefined)
    setIsPlaying(false)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Upload or Record Voice
        </h2>
        <p className="text-muted-foreground">Voice sample for analysis</p>
      </div>

      <Card className="bg-secondary/50 border-0 p-6 mb-8 flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Mic className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">
            Voice Recording
          </h3>
          <p className="text-sm text-muted-foreground">
            Record a voice sample or upload an audio file for UPDRS analysis
          </p>
        </div>
      </Card>

      <div className="space-y-6">
        {/* Recording Controls */}
        {!recordedUrl && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex-1 flex items-center justify-center gap-2 ${
                  isRecording
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-primary hover:bg-primary/90'
                } text-primary-foreground`}
              >
                <Mic className="w-4 h-4" />
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {isRecording && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-destructive rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-destructive">
                    Recording in progress...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recording Preview */}
        {recordedUrl && (
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    Voice Sample Recorded
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ready for analysis
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecording}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <audio
              ref={audioRef}
              src={recordedUrl}
              onEnded={() => setIsPlaying(false)}
            />

            <Button
              onClick={togglePlayback}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Play
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
