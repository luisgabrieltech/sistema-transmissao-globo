import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// GET - Listar backups
export async function GET() {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const backups = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        size: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(backups)
  } catch (error) {
    console.error('Erro ao buscar backups:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    if (!type || !['FULL', 'CAMERAS', 'USERS', 'SETTINGS'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de backup inválido' },
        { status: 400 }
      )
    }

    // Criar o backup inicial
    let backupName = ''
    switch (type) {
      case 'FULL':
        backupName = 'Backup Completo - Sistema'
        break
      case 'CAMERAS':
        backupName = 'Backup - Câmeras'
        break
      case 'USERS':
        backupName = 'Backup - Usuários'
        break
      case 'SETTINGS':
        backupName = 'Backup - Configurações'
        break
    }

    const backup = await prisma.backup.create({
      data: {
        name: `${backupName} - ${new Date().toLocaleDateString('pt-BR')}`,
        type: type as any,
        status: 'IN_PROGRESS',
      }
    })

    // Processar backup em background
    processBackup(backup.id, type)

    return NextResponse.json(backup, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar backup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para processar backup (simula processamento assíncrono)
async function processBackup(backupId: string, type: string) {
  try {
    let backupData: any = {}
    let dataSize = 0

    switch (type) {
      case 'CAMERAS':
        const cameras = await prisma.camera.findMany()
        backupData = { cameras }
        dataSize = JSON.stringify(cameras).length
        break

      case 'USERS':
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          }
        })
        backupData = { users }
        dataSize = JSON.stringify(users).length
        break

      case 'SETTINGS':
        const settings = await prisma.systemConfig.findMany()
        backupData = { settings }
        dataSize = JSON.stringify(settings).length
        break

      case 'FULL':
        const allCameras = await prisma.camera.findMany()
        const allUsers = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          }
        })
        const allSettings = await prisma.systemConfig.findMany()
        
        backupData = {
          cameras: allCameras,
          users: allUsers,
          settings: allSettings,
          metadata: {
            version: '1.0',
            exportDate: new Date().toISOString(),
            type: 'FULL'
          }
        }
        dataSize = JSON.stringify(backupData).length
        break
    }

    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Atualizar backup com dados
    await prisma.backup.update({
      where: { id: backupId },
      data: {
        status: 'COMPLETED',
        data: backupData,
        size: dataSize,
      }
    })

  } catch (error) {
    console.error('Erro ao processar backup:', error)
    
    // Marcar backup como falhado
    await prisma.backup.update({
      where: { id: backupId },
      data: {
        status: 'FAILED',
      }
    })
  }
} 