import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// GET - Download backup específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const backup = await prisma.backup.findUnique({
      where: { id: params.id }
    })

    if (!backup) {
      return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    }

    if (backup.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Backup não está completo' }, { status: 400 })
    }

    // Preparar dados para download
    const fileName = `${backup.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`
    const jsonData = JSON.stringify(backup.data, null, 2)

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': jsonData.length.toString(),
      },
    })

  } catch (error) {
    console.error('Erro ao fazer download do backup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const backup = await prisma.backup.findUnique({
      where: { id: params.id }
    })

    if (!backup) {
      return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    }

    await prisma.backup.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Backup excluído com sucesso' })

  } catch (error) {
    console.error('Erro ao excluir backup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 