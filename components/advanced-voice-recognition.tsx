"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Volume2, Settings } from "lucide-react"
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

interface AdvancedVoiceRecognitionProps {
  isActive: boolean
  onTextRecognized: (text: string, confidence: number) => void
  recognizedText: string
  systemConfig?: {
    speechApiKey: string | null
    voiceThreshold: number
    autoSwitchEnabled: boolean
  }
}

export function AdvancedVoiceRecognition({ 
  isActive, 
  onTextRecognized, 
  recognizedText,
  systemConfig 
}: AdvancedVoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [useGoogleSpeech, setUseGoogleSpeech] = useState(false)
  const [recognitionMode, setRecognitionMode] = useState<'browser' | 'google'>('browser')
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Detectar se Google Speech API está disponível
  useEffect(() => {
    const hasGoogleApiKey = systemConfig?.speechApiKey && systemConfig.speechApiKey.length > 0
    setUseGoogleSpeech(hasGoogleApiKey || false)
    setRecognitionMode(hasGoogleApiKey ? 'google' : 'browser')
  }, [systemConfig?.speechApiKey])

  // Reconhecimento usando Web Speech API (browser nativo)
  useEffect(() => {
    if (recognitionMode !== 'browser') return

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

    return () => {
      SpeechRecognition.stopListening();
    }
  }, [isActive, browserSupportsSpeechRecognition, listening, recognitionMode])

  // Reconhecimento usando Google Speech API
  useEffect(() => {
    if (recognitionMode !== 'google' || !systemConfig?.speechApiKey) return

    let recognition: any = null

    if (isActive) {
      startGoogleSpeechRecognition()
    } else {
      stopGoogleSpeechRecognition()
    }

    async function startGoogleSpeechRecognition() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
        
        // Configurar MediaRecorder com formato específico
        const options = { mimeType: 'audio/webm;codecs=opus' }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn('WEBM OPUS não suportado, tentando WAV')
          options.mimeType = 'audio/wav'
        }
        
        mediaRecorderRef.current = new MediaRecorder(stream, options)
        chunksRef.current = []

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data)
          }
        }

        mediaRecorderRef.current.onstop = async () => {
          const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm;codecs=opus'
          const audioBlob = new Blob(chunksRef.current, { type: mimeType })
          await processAudioWithGoogleAPI(audioBlob, mimeType)
        }

        // Gravar em chunks de 4 segundos para processamento contínuo
        mediaRecorderRef.current.start()
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
            if (isActive) {
              startGoogleSpeechRecognition() // Reiniciar para reconhecimento contínuo
            }
          }
        }, 4000)

        setIsListening(true)
      } catch (error) {
        console.error('Erro ao iniciar Google Speech:', error)
        // Fallback para browser speech
        setRecognitionMode('browser')
        console.warn('Fallback ativado: usando reconhecimento do navegador devido a erro na Google Speech API')
      }
    }

    function stopGoogleSpeechRecognition() {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      setIsListening(false)
    }

    return () => {
      stopGoogleSpeechRecognition()
    }
  }, [isActive, recognitionMode, systemConfig?.speechApiKey])

  // Processar áudio com Google Speech API
  async function processAudioWithGoogleAPI(audioBlob: Blob, mimeType: string) {
    if (!systemConfig?.speechApiKey) return

    try {
      // Determinar encoding baseado no mimeType
      let encoding = 'WEBM_OPUS'
      
      if (mimeType.includes('wav')) {
        encoding = 'LINEAR16'
      } else if (mimeType.includes('opus')) {
        encoding = 'WEBM_OPUS'
      }

      // Converter blob para base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]

        console.log('Enviando para Google Speech API:', {
          encoding,
          audioSize: audioBlob.size,
          mimeType
        })

        const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${systemConfig.speechApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            config: {
              encoding: encoding,
              // Removendo sampleRateHertz para auto-detecção
              languageCode: 'pt-BR',
              enableAutomaticPunctuation: true,
              audioChannelCount: 1,
            },
            audio: {
              content: base64Audio
            }
          })
        })

        const result = await response.json()
        console.log('Resposta Google Speech API:', result)
        
        if (!response.ok) {
          console.error('Erro HTTP da Google Speech API:', response.status, result)
          // Fallback para browser speech em caso de erro
          setRecognitionMode('browser')
          return
        }
        
        if (result.results && result.results.length > 0) {
          const transcript = result.results[0].alternatives[0].transcript
          const confidence = (result.results[0].alternatives[0].confidence || 0.9) * 100
          
          setConfidence(confidence)
          
          // Aplicar threshold de confiança
          if (confidence >= (systemConfig.voiceThreshold || 85)) {
            onTextRecognized(transcript, confidence)
          }
        } else {
          console.log('Nenhum resultado de speech-to-text')
        }
      }
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Erro ao processar com Google Speech API:', error)
      // Fallback para browser speech em caso de erro
      setRecognitionMode('browser')
    }
  }

  // Configurar análise de áudio para visualização
  useEffect(() => {
    if (!isActive) return

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
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [isActive])

  // Atualizar texto reconhecido do browser speech
  useEffect(() => {
    if (recognitionMode === 'browser' && transcript) {
      // Simular confiança de 90% para browser speech
      const browserConfidence = 90
      setConfidence(browserConfidence)
      
      // Aplicar threshold
      if (browserConfidence >= (systemConfig?.voiceThreshold || 85)) {
        onTextRecognized(transcript, browserConfidence)
      }
    }
  }, [transcript, onTextRecognized, recognitionMode, systemConfig?.voiceThreshold]);

  const currentlyListening = recognitionMode === 'browser' ? listening : isListening

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentlyListening ? (
              <Mic className="h-5 w-5 text-red-400 animate-pulse" />
            ) : (
              <MicOff className="h-5 w-5 text-gray-400" />
            )}
            <span>Reconhecimento de Voz Avançado</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={recognitionMode === 'google' ? "default" : "secondary"}
              className="text-xs"
            >
              {recognitionMode === 'google' ? 'Google Speech API' : 'Browser Nativo'}
            </Badge>
            <Badge variant={currentlyListening ? "default" : "secondary"}>
              {currentlyListening ? "ATIVO" : "INATIVO"}
            </Badge>
            {confidence > 0 && (
              <Badge 
                variant={confidence >= (systemConfig?.voiceThreshold || 85) ? "default" : "destructive"}
                className="text-xs"
              >
                {confidence.toFixed(0)}% confiança
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Informações de configuração */}
        <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-700 rounded p-2">
          <div className="flex items-center space-x-2">
            <Settings className="h-3 w-3" />
            <span>Threshold: {systemConfig?.voiceThreshold || 85}%</span>
          </div>
          <span>
            Auto-switch: {systemConfig?.autoSwitchEnabled ? "Ativado" : "Desativado"}
          </span>
        </div>

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
            {recognizedText || (currentlyListening ? "Aguardando fala..." : "Reconhecimento inativo")}
          </p>
        </div>

        {/* Status de conexão */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Status: {currentlyListening ? "Ouvindo" : "Parado"}</span>
          <span>Idioma: Português (BR)</span>
        </div>
      </CardContent>
    </Card>
  )
} 