"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Archive, Download, FileText, Calendar, CheckCircle, AlertCircle, Trash2, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BackupData {
  id: string
  name: string
  type: "FULL" | "CAMERAS" | "USERS" | "SETTINGS"
  size: number
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED"
  createdAt: string
  updatedAt: string
}

export default function BackupsPage() {
  const { data: session, status } = useSession()
  const [backups, setBackups] = useState<BackupData[]>([])
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Carregar backups da API
  const loadBackups = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/backup')
      if (response.ok) {
        const data = await response.json()
        setBackups(data)
      } else {
        console.error('Erro ao carregar backups')
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session) {
      loadBackups()
    }
  }, [session])

  useEffect(() => {
    const hasInProgress = backups.some(b => b.status === 'IN_PROGRESS')
    if (hasInProgress) {
      const interval = setInterval(loadBackups, 2000)
      return () => clearInterval(interval)
    }
  }, [backups])

  if (status === "loading") return <div>Carregando...</div>
  if (status === "unauthenticated") redirect("/login")

  const handleCreateBackup = async (type: "FULL" | "CAMERAS" | "USERS" | "SETTINGS") => {
    try {
      setIsCreatingBackup(true)

      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (response.ok) {
        const newBackup = await response.json()
        setBackups([newBackup, ...backups])
        
        toast({
          title: "Backup iniciado",
          description: `${newBackup.name} está sendo criado`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro ao criar backup",
          description: error.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error)
      toast({
        title: "Erro ao criar backup",
        description: "Erro de conexão",
        variant: "destructive",
      })
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleDownloadBackup = async (backup: BackupData) => {
    try {
      const response = await fetch(`/api/backup/${backup.id}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${backup.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Download concluído",
          description: `${backup.name} foi baixado`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro no download",
          description: error.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro no download:', error)
      toast({
        title: "Erro no download",
        description: "Erro de conexão",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBackup = async (backup: BackupData) => {
    if (!confirm(`Tem certeza que deseja excluir o backup "${backup.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/backup/${backup.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setBackups(backups.filter(b => b.id !== backup.id))
        toast({
          title: "Backup excluído",
          description: `${backup.name} foi removido`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro ao excluir",
          description: error.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao excluir backup:', error)
      toast({
        title: "Erro ao excluir",
        description: "Erro de conexão",
        variant: "destructive",
      })
    }
  }

  const handleRestoreBackup = async (backup: BackupData) => {
    const confirmMessage = `⚠️ ATENÇÃO: Esta ação irá substituir os dados atuais do sistema!

Backup: "${backup.name}"
Tipo: ${getTypeLabel(backup.type)}

${backup.type === 'FULL' ? '• Todas as câmeras serão substituídas\n• Configurações serão substituídas\n• Usuários existentes: SENHAS MANTIDAS (só atualiza nome/role)\n• Usuários novos: senha padrão 123456' : 
  backup.type === 'CAMERAS' ? '• Todas as câmeras atuais serão removidas\n• Câmeras do backup serão restauradas' :
  backup.type === 'USERS' ? '• Usuários existentes: SENHAS MANTIDAS (só atualiza nome/role)\n• Usuários novos: senha padrão 123456' :
  '• Configurações atuais serão substituídas'}

Tem certeza que deseja continuar?`

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/backup/${backup.id}/restore`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Backup restaurado com sucesso! 🎉",
          description: `${result.backupName} - ${result.restoredCount} itens restaurados`,
        })
        
        // Recarregar a página após alguns segundos para refletir as mudanças
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const error = await response.json()
        toast({
          title: "Erro ao restaurar backup",
          description: error.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error)
      toast({
        title: "Erro ao restaurar backup",
        description: "Erro de conexão",
        variant: "destructive",
      })
    }
  }



  const getTypeLabel = (type: string) => {
    const labels = {
      FULL: "Completo",
      CAMERAS: "Câmeras", 
      USERS: "Usuários",
      SETTINGS: "Configurações",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "FAILED":
        return <AlertCircle className="h-4 w-4 text-red-400" />
      case "IN_PROGRESS":
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      COMPLETED: "Concluído",
      FAILED: "Falhou",
      IN_PROGRESS: "Em progresso",
    }
    return labels[status as keyof typeof labels] || status
  }

  const formatSize = (size: number) => {
    if (size === 0) return "0 B"
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Archive className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Backup e Restauração</h1>
          </div>
          <Button 
            onClick={loadBackups}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? "Atualizando..." : "Atualizar"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Criar Backup */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Criar Novo Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Button
                    onClick={() => handleCreateBackup("FULL")}
                    disabled={isCreatingBackup}
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Backup Completo
                  </Button>
                  <Button
                    onClick={() => handleCreateBackup("CAMERAS")}
                    disabled={isCreatingBackup}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Apenas Câmeras
                  </Button>
                  <Button
                    onClick={() => handleCreateBackup("USERS")}
                    disabled={isCreatingBackup}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Apenas Usuários
                  </Button>
                  <Button
                    onClick={() => handleCreateBackup("SETTINGS")}
                    disabled={isCreatingBackup}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Configurações
                  </Button>
                </div>

                {isCreatingBackup && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-400">Iniciando backup...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações sobre Restauração */}
            <Card className="bg-gray-800 border-gray-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white">💡 Como Restaurar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-300">
                  <div className="flex items-start space-x-2">
                    <RotateCcw className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Clique no botão verde para restaurar backup diretamente</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Download className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Baixe arquivos JSON para backup externo</span>
                  </div>
                  <div className="bg-amber-900/20 border border-amber-600/30 rounded p-3 mt-4">
                    <p className="text-amber-300 text-xs mb-2">
                      ⚠️ <strong>Atenção - Sobre Senhas:</strong>
                    </p>
                    <ul className="text-amber-200 text-xs space-y-1 ml-4">
                      <li>• <strong>Usuários existentes:</strong> Senhas são MANTIDAS</li>
                      <li>• <strong>Usuários novos:</strong> Senha padrão 123456</li>
                      <li>• <strong>Backups nunca</strong> contêm senhas (segurança)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Backups */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  Backups Disponíveis ({backups.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {backups.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum backup encontrado</p>
                      <p className="text-sm">Crie seu primeiro backup usando os botões ao lado</p>
                    </div>
                  ) : (
                    backups.map((backup) => (
                      <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Archive className="h-5 w-5 text-blue-400" />
                            <h3 className="font-semibold text-white">{backup.name}</h3>
                            <Badge variant="outline">{getTypeLabel(backup.type)}</Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(backup.createdAt)}</span>
                            </div>
                            <span>{formatSize(backup.size)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(backup.status)}
                            <Badge 
                              variant={
                                backup.status === "COMPLETED" ? "default" : 
                                backup.status === "FAILED" ? "destructive" : "secondary"
                              }
                            >
                              {getStatusLabel(backup.status)}
                            </Badge>
                          </div>
                          {backup.status === "COMPLETED" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleRestoreBackup(backup)}
                                className="text-green-400 hover:text-green-300"
                                title="Restaurar backup diretamente no sistema"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDownloadBackup(backup)}
                                title="Baixar arquivo JSON"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteBackup(backup)}
                                className="text-red-400 hover:text-red-300"
                                title="Excluir backup"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
