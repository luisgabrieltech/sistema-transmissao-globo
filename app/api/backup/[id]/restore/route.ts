import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

// POST - Restaurar backup específico
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar o backup
    const backup = await prisma.backup.findUnique({
      where: { id: params.id }
    })

    if (!backup) {
      return NextResponse.json({ error: 'Backup não encontrado' }, { status: 404 })
    }

    if (backup.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Backup não está completo' }, { status: 400 })
    }

    if (!backup.data) {
      return NextResponse.json({ error: 'Backup não possui dados' }, { status: 400 })
    }

    const backupData = backup.data as any
    let restoredCount = 0

    // Aplicar restauração baseado no tipo
    switch (backup.type) {
      case 'CAMERAS':
        if (backupData.cameras) {
          // Limpar câmeras existentes
          await prisma.camera.deleteMany()
          
          // Restaurar câmeras do backup
          for (const camera of backupData.cameras) {
            await prisma.camera.create({
              data: {
                name: camera.name,
                location: camera.location,
                rtspUrl: camera.rtspUrl,
                hlsUrl: camera.hlsUrl || null,
                keywords: camera.keywords || [],
                status: camera.status || 'OFFLINE',
                isActive: camera.isActive || false,
              }
            })
            restoredCount++
          }
        }
        break

      case 'USERS':
        if (backupData.users) {
          // NÃO deletar todos os usuários para evitar lockout
          // Apenas atualizar/criar usuários do backup
          
          for (const user of backupData.users) {
            // Verificar se usuário já existe
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email }
            })

            if (existingUser) {
              // Atualizar usuário existente (sem senha)
              await prisma.user.update({
                where: { email: user.email },
                data: {
                  name: user.name,
                  role: user.role,
                  status: user.status,
                }
              })
            } else {
              // Criar novo usuário com senha padrão
              const defaultPassword = await bcrypt.hash('123456', 10)
              await prisma.user.create({
                data: {
                  name: user.name,
                  email: user.email,
                  password: defaultPassword,
                  role: user.role,
                  status: user.status,
                }
              })
            }
            restoredCount++
          }
        }
        break

      case 'SETTINGS':
        if (backupData.settings) {
          // Limpar configurações existentes
          await prisma.systemConfig.deleteMany()
          
          // Restaurar configurações do backup
          for (const config of backupData.settings) {
            await prisma.systemConfig.create({
              data: {
                speechApiKey: config.speechApiKey || null,
                mediaMtxUrl: config.mediaMtxUrl || 'http://localhost:8888',
                voiceThreshold: config.voiceThreshold || 85,
                autoSwitchEnabled: config.autoSwitchEnabled !== undefined ? config.autoSwitchEnabled : true,
              }
            })
            restoredCount++
          }
        }
        break

      case 'FULL':
        // Restaurar câmeras
        if (backupData.cameras) {
          await prisma.camera.deleteMany()
          for (const camera of backupData.cameras) {
            await prisma.camera.create({
              data: {
                name: camera.name,
                location: camera.location,
                rtspUrl: camera.rtspUrl,
                hlsUrl: camera.hlsUrl || null,
                keywords: camera.keywords || [],
                status: camera.status || 'OFFLINE',
                isActive: camera.isActive || false,
              }
            })
          }
        }

        // Restaurar configurações
        if (backupData.settings) {
          await prisma.systemConfig.deleteMany()
          for (const config of backupData.settings) {
            await prisma.systemConfig.create({
              data: {
                speechApiKey: config.speechApiKey || null,
                mediaMtxUrl: config.mediaMtxUrl || 'http://localhost:8888',
                voiceThreshold: config.voiceThreshold || 85,
                autoSwitchEnabled: config.autoSwitchEnabled !== undefined ? config.autoSwitchEnabled : true,
              }
            })
          }
        }

        // Restaurar usuários (sem deletar todos - segurança)
        if (backupData.users) {
          for (const user of backupData.users) {
            const existingUser = await prisma.user.findUnique({
              where: { email: user.email }
            })

            if (existingUser) {
              await prisma.user.update({
                where: { email: user.email },
                data: {
                  name: user.name,
                  role: user.role,
                  status: user.status,
                }
              })
            } else {
              const defaultPassword = await bcrypt.hash('123456', 10)
              await prisma.user.create({
                data: {
                  name: user.name,
                  email: user.email,
                  password: defaultPassword,
                  role: user.role,
                  status: user.status,
                }
              })
            }
          }
          restoredCount = (backupData.cameras?.length || 0) + 
                          (backupData.settings?.length || 0) + 
                          (backupData.users?.length || 0)
        }
        break

      default:
        return NextResponse.json({ error: 'Tipo de backup não suportado' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Backup restaurado com sucesso',
      type: backup.type,
      restoredCount,
      backupName: backup.name,
    })

  } catch (error) {
    console.error('Erro ao restaurar backup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao restaurar backup' },
      { status: 500 }
    )
  }
} 