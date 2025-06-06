"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VideoPlayer } from "@/components/video-player"
import { CameraList } from "@/components/camera-list"
import { AdvancedVoiceRecognition } from "@/components/advanced-voice-recognition"
import { Header } from "@/components/header"
import { Camera, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CameraData {
  id: string
  name: string
  location: string
  rtspUrl: string
  keywords: string[]
  isActive: boolean
  status: "online" | "offline" | "error"
}

export default function CamerasPage() {
  const { data: session, status } = useSession()
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [activeCamera, setActiveCamera] = useState<CameraData | null>(null)
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [recognizedText, setRecognizedText] = useState("")
  const [systemConfig, setSystemConfig] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") redirect("/login")

    // Buscar câmeras da API
    const fetchCameras = async () => {
      try {
        const response = await fetch('/api/cameras')
        if (!response.ok) throw new Error('Falha ao carregar câmeras')
        const data = await response.json()
        
        // Mapear os dados e adicionar isActive
        const camerasWithActive = data.map((camera: CameraData) => ({
          ...camera,
          isActive: false,
          status: camera.status.toLowerCase() as "online" | "offline" | "error"
        }))
        
        setCameras(camerasWithActive)
        // Definir a primeira câmera como ativa
        if (camerasWithActive.length > 0) {
          setActiveCamera(camerasWithActive[0])
          setCameras(prev => prev.map(cam => ({
            ...cam,
            isActive: cam.id === camerasWithActive[0].id
          })))
        }
      } catch (error) {
        console.error('Erro ao carregar câmeras:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar as câmeras",
          variant: "destructive"
        })
      }
    }

    // Buscar configurações do sistema
    const fetchSystemConfig = async () => {
      try {
        const response = await fetch('/api/system-config')
        if (!response.ok) throw new Error('Falha ao carregar configurações')
        const data = await response.json()
        setSystemConfig(data)
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }

    fetchCameras()
    fetchSystemConfig()
  }, [status, toast])

  const handleCameraSwitch = (camera: CameraData) => {
    setActiveCamera(camera)
    setCameras(prev =>
      prev.map(c => ({
        ...c,
        isActive: c.id === camera.id,
      })),
    )

    toast({
      title: "Câmera alterada",
      description: `Exibindo: ${camera.name}`,
    })
  }

  const handleVoiceCommand = (text: string, confidence: number) => {
    setRecognizedText(text)

    // Verificar se auto-switch está habilitado
    if (!systemConfig?.autoSwitchEnabled) return

    // Buscar câmera baseada nas palavras-chave
    const matchedCamera = cameras.find((camera) =>
      camera.keywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase())),
    )

    if (matchedCamera && matchedCamera.id !== activeCamera?.id) {
      handleCameraSwitch(matchedCamera)
      toast({
        title: "Comando de voz detectado",
        description: `Alterando para: ${matchedCamera.name} (${confidence.toFixed(0)}% confiança)`,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Lista de câmeras lateral */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Camera className="mr-2 h-5 w-5" />
              Câmeras Disponíveis
            </h2>
            <CameraList cameras={cameras} activeCamera={activeCamera} onCameraSelect={handleCameraSwitch} />
          </div>
        </div>

        {/* Player principal */}
        <div className="flex-1 flex flex-col">
          {/* Controles superiores */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-white">
                  {activeCamera?.name || "Nenhuma câmera selecionada"}
                </h1>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={isAudioEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                >
                  {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                <Button
                  variant={isVoiceActive ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsVoiceActive(!isVoiceActive)}
                >
                  {isVoiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  {isVoiceActive ? "Parar Reconhecimento" : "Iniciar Reconhecimento"}
                </Button>
              </div>
            </div>
          </div>

          {/* Player de vídeo */}
          <div className="flex-1 bg-black relative">
            {activeCamera ? (
              <VideoPlayer
                src={activeCamera.rtspUrl}
                poster="/placeholder.svg?height=720&width=1280"
                muted={!isAudioEnabled}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Selecione uma câmera para visualizar</p>
                </div>
              </div>
            )}
          </div>

          {/* Painel de reconhecimento de voz */}
          {isVoiceActive && (
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <AdvancedVoiceRecognition
                isActive={isVoiceActive}
                onTextRecognized={handleVoiceCommand}
                recognizedText={recognizedText}
                systemConfig={systemConfig}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
