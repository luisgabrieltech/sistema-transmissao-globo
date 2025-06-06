import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cameraId = params.id
    const body = await request.json()
    const { name, location, rtspUrl, keywords } = body

    // Verificar se a câmera existe
    const existingCamera = await prisma.camera.findUnique({
      where: { id: cameraId },
    })

    if (!existingCamera) {
      return NextResponse.json({ error: "Câmera não encontrada" }, { status: 404 })
    }

    // Atualizar a câmera
    const updatedCamera = await prisma.camera.update({
      where: { id: cameraId },
      data: {
        name,
        location,
        rtspUrl,
        keywords: keywords || [],
      },
    })

    return NextResponse.json(updatedCamera)
  } catch (error) {
    console.error("Error updating camera:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cameraId = params.id

    // Verificar se a câmera existe
    const existingCamera = await prisma.camera.findUnique({
      where: { id: cameraId },
    })

    if (!existingCamera) {
      return NextResponse.json({ error: "Câmera não encontrada" }, { status: 404 })
    }

    // Deletar a câmera
    await prisma.camera.delete({
      where: { id: cameraId },
    })

    return NextResponse.json({ message: "Câmera removida com sucesso" })
  } catch (error) {
    console.error("Error deleting camera:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 