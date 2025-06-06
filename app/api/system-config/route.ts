import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Buscar configuração existente
    let config = await prisma.systemConfig.findFirst()
    
    // Se não existir, criar uma padrão
    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          mediaMtxUrl: 'http://localhost:8888',
          voiceThreshold: 85,
          autoSwitchEnabled: true
        }
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { speechApiKey, mediaMtxUrl, voiceThreshold, autoSwitchEnabled } = body

    // Buscar configuração existente
    let config = await prisma.systemConfig.findFirst()
    
    if (config) {
      // Atualizar configuração existente
      config = await prisma.systemConfig.update({
        where: { id: config.id },
        data: {
          speechApiKey: speechApiKey || null,
          mediaMtxUrl: mediaMtxUrl || 'http://localhost:8888',
          voiceThreshold: parseInt(voiceThreshold) || 85,
          autoSwitchEnabled: autoSwitchEnabled !== undefined ? autoSwitchEnabled : true
        }
      })
    } else {
      // Criar nova configuração
      config = await prisma.systemConfig.create({
        data: {
          speechApiKey: speechApiKey || null,
          mediaMtxUrl: mediaMtxUrl || 'http://localhost:8888',
          voiceThreshold: parseInt(voiceThreshold) || 85,
          autoSwitchEnabled: autoSwitchEnabled !== undefined ? autoSwitchEnabled : true
        }
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 