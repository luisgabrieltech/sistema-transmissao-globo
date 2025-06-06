"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2 } from "lucide-react"
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

interface VoiceRecognitionProps {
  isActive: boolean
  onTextRecognized: (text: string) => void
  recognizedText: string
}

export function VoiceRecognition({ isActive, onTextRecognized, recognizedText }: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.error('Navegador não suporta reconhecimento de voz');
      return;
    }

    if (!isActive) {
      SpeechRecognition.stopListening();
      return;
    }

    if (isActive && !listening) {
      SpeechRecognition.startListening({ 
        continuous: true,
        language: 'pt-BR'
      });
    }

    // Configurar análise de áudio para visualização
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const microphone = audioContext.createMediaStreamSource(stream)

        analyser.fftSize = 256
        microphone.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Monitorar nível de áudio
        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const updateAudioLevel = () => {
          if (analyser && isActive) {
            analyser.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length
            setAudioLevel(average)
            requestAnimationFrame(updateAudioLevel)
          }
        }
        updateAudioLevel()
      })
      .catch((error) => {
        console.error("Erro ao acessar microfone:", error)
      })

    return () => {
      SpeechRecognition.stopListening();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [isActive, browserSupportsSpeechRecognition, listening])

  // Atualiza o texto reconhecido quando houver mudanças
  useEffect(() => {
    if (transcript) {
      onTextRecognized(transcript);
    }
  }, [transcript, onTextRecognized]);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {listening ? (
              <Mic className="h-5 w-5 text-red-400 animate-pulse" />
            ) : (
              <MicOff className="h-5 w-5 text-gray-400" />
            )}
            <span>Reconhecimento de Voz</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={listening ? "default" : "secondary"}>{listening ? "ATIVO" : "INATIVO"}</Badge>
            {confidence > 0 && <Badge variant="outline">{confidence.toFixed(0)}% confiança</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Visualizador de áudio */}
        <div className="flex items-center space-x-2">
          <Volume2 className="h-4 w-4 text-gray-400" />
          <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-red-500 transition-all duration-100"
              style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8">{Math.round(audioLevel)}</span>
        </div>

        {/* Texto reconhecido */}
        <div className="bg-gray-700 rounded-lg p-3 min-h-[60px]">
          <p className="text-sm text-gray-300 mb-1">Último texto reconhecido:</p>
          <p className="text-white font-medium">
            {recognizedText || (listening ? "Aguardando fala..." : "Reconhecimento inativo")}
          </p>
        </div>

        {/* Status de conexão */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Status: {listening ? "Ouvindo" : "Parado"}</span>
          <span>Idioma: Português (BR)</span>
        </div>
      </CardContent>
    </Card>
  )
}
