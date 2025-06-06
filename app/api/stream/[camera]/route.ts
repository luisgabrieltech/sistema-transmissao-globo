import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { camera: string } }) {
  const cameraName = params.camera.replace(".m3u8", "")

  // Em produção, isso seria redirecionado para o MediaMTX
  // Por enquanto, retornamos uma URL de exemplo
  const hlsUrl = `http://localhost:8888/hls/${cameraName}.m3u8`

  return NextResponse.redirect(hlsUrl)
}
