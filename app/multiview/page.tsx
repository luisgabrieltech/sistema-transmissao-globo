"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VideoPlayer } from "@/components/video-player"
import { Header } from "@/components/header"
import { Grid3X3, Maximize2, Volume2, VolumeX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CameraData {
  id: string
  name: string
  location: string
  rtspUrl: string
  keywords: string[]
  status: "ONLINE" | "OFFLINE" | "ERROR"
}

export default function MultiviewPage() {
  const { data: session, status } = useSession()
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [audioEnabled, setAudioEnabled] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") redirect("/login")

    const fetchCameras = async () => {
      try {
        const response = await fetch('/api/cameras')
        if (!response.ok) throw new Error('Falha ao carregar câmeras')
        const data = await response.json()
        
        // Mapear os dados
        const formattedCameras = data.map((camera: CameraData) => ({
          ...camera
        }))
        
        setCameras(formattedCameras)
      } catch (error) {
        console.error('Erro ao carregar câmeras:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar as câmeras",
          variant: "destructive"
        })
      }
    }

    fetchCameras()
  }, [status, toast])

  if (status === "loading") return <div>Carregando...</div>
  if (status === "unauthenticated") redirect("/login")

  const handleCameraSelect = (cameraId: string) => {
    setSelectedCamera(selectedCamera === cameraId ? null : cameraId)
  }

  const handleAudioToggle = (cameraId: string) => {
    setAudioEnabled(audioEnabled === cameraId ? null : cameraId)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Grid3X3 className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Multiview - Produção</h1>
          </div>
        </div>

        {/* Grid de câmeras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((camera) => (
            <Card
              key={camera.id}
              className={`bg-gray-800 border-gray-700 transition-all duration-200 ${
                selectedCamera === camera.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-white">{camera.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAudioToggle(camera.id)}
                      className="h-6 w-6 p-0"
                    >
                      {audioEnabled === camera.id ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCameraSelect(camera.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{camera.location}</p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-b-lg overflow-hidden">
                  <VideoPlayer
                    src={camera.rtspUrl}
                    poster={`/placeholder.svg?height=180&width=320&query=${camera.name} camera feed`}
                    muted={audioEnabled !== camera.id}
                    controls={false}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Câmera selecionada em destaque */}
        {selectedCamera && (
          <div className="mt-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Câmera em Destaque: {cameras.find((c) => c.id === selectedCamera)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <VideoPlayer
                    src={cameras.find((c) => c.id === selectedCamera)?.rtspUrl || ""}
                    poster={`/placeholder.svg?height=480&width=854&query=${cameras.find((c) => c.id === selectedCamera)?.name} camera feed`}
                    muted={audioEnabled !== selectedCamera}
                    controls={true}
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
