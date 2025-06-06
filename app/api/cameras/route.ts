import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cameras = await prisma.camera.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(cameras)
  } catch (error) {
    console.error("Error fetching cameras:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, location, rtspUrl, keywords } = body

    const camera = await prisma.camera.create({
      data: {
        name,
        location,
        rtspUrl,
        keywords: keywords || [],
        status: "OFFLINE",
      },
    })

    return NextResponse.json(camera, { status: 201 })
  } catch (error) {
    console.error("Error creating camera:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
