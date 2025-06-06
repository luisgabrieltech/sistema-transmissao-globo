"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  src: string
  poster?: string
  muted?: boolean
  controls?: boolean
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  muted = false,
  controls = true,
  className = "w-full h-full",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(muted)
  const [error, setError] = useState<string | null>(null)

  // Função para converter URL RTSP em URL HLS
  const getRTMPStreamUrl = (rtspUrl: string) => {
    try {
      // Extrair o número do canal da URL RTSP
      const channelMatch = rtspUrl.match(/channel=(\d+)/)
      if (!channelMatch) throw new Error("Canal não encontrado na URL")
      
      const channel = channelMatch[1]
      // Retornar a URL HLS do MediaMTX usando o caminho correto
      return `http://localhost:8888/cam${channel}/stream.m3u8`
    } catch (err) {
      console.error("Erro ao converter URL:", err)
      // Se houver erro na conversão, tentar usar a URL RTSP diretamente
      return src
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Converter URL RTSP para HLS
    const hlsUrl = getRTMPStreamUrl(src)
    console.log("Tentando carregar stream:", hlsUrl)

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: true,
        backBufferLength: 90,
        debug: true, // Habilitar logs para debug
      })

      hlsRef.current = hls
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed, starting playback")
        video.play().catch(err => {
          console.error("Erro ao iniciar playback:", err)
          setError("Erro ao iniciar a reprodução do vídeo")
        })
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log("Erro de rede, tentando reconectar...")
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log("Erro de mídia, tentando recuperar...")
              hls.recoverMediaError()
              break
            default:
              setError("Erro ao carregar o stream de vídeo. Verifique se o MediaMTX está configurado e rodando.")
              break
          }
        }
      })
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      video.src = hlsUrl
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(err => {
          console.error("Erro ao iniciar playback no Safari:", err)
          setError("Erro ao iniciar a reprodução do vídeo no Safari")
        })
      })
    } else {
      setError("HLS não é suportado neste navegador")
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  if (error) {
    return (
      <div className={`${className} bg-gray-900 flex items-center justify-center`}>
        <div className="text-center text-gray-400">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className} bg-black group`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        muted={isMuted}
        playsInline
        autoPlay
      />

      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={togglePlay} className="text-white hover:bg-white/20">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" size="sm" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
