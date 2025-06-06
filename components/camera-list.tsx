"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin } from "lucide-react"

interface CameraData {
  id: string
  name: string
  location: string
  keywords: string[]
  isActive: boolean
  status: "online" | "offline" | "error"
}

interface CameraListProps {
  cameras: CameraData[]
  activeCamera: CameraData | null
  onCameraSelect: (camera: CameraData) => void
}

export function CameraList({ cameras, activeCamera, onCameraSelect }: CameraListProps) {
  return (
    <div className="space-y-3">
      {cameras.map((camera) => (
        <Card
          key={camera.id}
          className={`cursor-pointer transition-all duration-200 ${
            activeCamera?.id === camera.id
              ? "bg-blue-600 border-blue-500"
              : "bg-gray-700 border-gray-600 hover:bg-gray-600"
          }`}
          onClick={() => onCameraSelect(camera)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Camera className="h-4 w-4 text-gray-300" />
                <h3 className="font-medium text-white text-sm">{camera.name}</h3>
              </div>
            </div>

            <div className="flex items-center text-xs text-gray-400 mb-2">
              <MapPin className="h-3 w-3 mr-1" />
              {camera.location}
            </div>

            <div className="flex flex-wrap gap-1">
              {camera.keywords.slice(0, 3).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1 py-0 text-gray-300 border-gray-500">
                  {keyword}
                </Badge>
              ))}
              {camera.keywords.length > 3 && (
                <Badge variant="outline" className="text-xs px-1 py-0 text-gray-300 border-gray-500">
                  +{camera.keywords.length - 3}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
