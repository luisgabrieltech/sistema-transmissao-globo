"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { Settings, Camera, Users, Plus, Edit, Trash2, Save, X, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CameraData {
  id: string
  name: string
  location: string
  rtspUrl: string
  keywords: string[]
  status: "ONLINE" | "OFFLINE" | "ERROR"
}

interface UserData {
  id: string
  name: string | null
  email: string
  role: "ADMIN" | "OPERATOR"
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}

interface SystemConfigData {
  id: string
  speechApiKey: string | null
  mediaMtxUrl: string
  voiceThreshold: number
  autoSwitchEnabled: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [cameras, setCameras] = useState<CameraData[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [editingCamera, setEditingCamera] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<CameraData> & { keywords?: any }>({})
  const [newCamera, setNewCamera] = useState({
    name: "",
    location: "",
    rtspUrl: "",
    keywords: "",
  })
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "OPERATOR" as "ADMIN" | "OPERATOR",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  
  // Estados para edição de usuários
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editUserForm, setEditUserForm] = useState<any>({})
  const [isEditingUser, setIsEditingUser] = useState(false)
  
  // Estados para configurações do sistema
  const [systemConfig, setSystemConfig] = useState<SystemConfigData | null>(null)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") redirect("/login")

    // Buscar câmeras reais da API
    const fetchCameras = async () => {
      try {
        const response = await fetch('/api/cameras')
        if (!response.ok) throw new Error('Falha ao carregar câmeras')
        const data = await response.json()
        setCameras(data)
      } catch (error) {
        console.error('Erro ao carregar câmeras:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar as câmeras",
          variant: "destructive"
        })
      }
    }

    // Buscar usuários reais da API
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (!response.ok) throw new Error('Falha ao carregar usuários')
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error('Erro ao carregar usuários:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar os usuários",
          variant: "destructive"
        })
      }
    }

    // Buscar configurações do sistema
    const fetchSystemConfig = async () => {
      try {
        const response = await fetch('/api/system-config')
        if (!response.ok) throw new Error('Falha ao carregar configurações')
        const data = await response.json()
        setSystemConfig(data)
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
        toast({
          title: "Erro",
          description: "Falha ao carregar as configurações do sistema",
          variant: "destructive"
        })
      }
    }

    fetchCameras()
    fetchUsers()
    fetchSystemConfig()
  }, [status, toast])

  if (status === "loading") return <div>Carregando...</div>
  if (status === "unauthenticated") redirect("/login")

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoadingUser(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao adicionar usuário')
      }

      const newUserData = await response.json()
      setUsers(prev => [newUserData, ...prev])
      setNewUser({ name: "", email: "", password: "", role: "OPERATOR" })

      toast({
        title: "Usuário adicionado",
        description: `${newUserData.name} foi adicionado com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao adicionar o usuário",
        variant: "destructive",
      })
    } finally {
      setIsLoadingUser(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleAddCamera = async () => {
    if (!newCamera.name || !newCamera.rtspUrl) {
      toast({
        title: "Erro",
        description: "Nome e URL RTSP são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCamera.name,
          location: newCamera.location,
          rtspUrl: newCamera.rtspUrl,
          keywords: newCamera.keywords.split(",").map((k) => k.trim()).filter(k => k),
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao adicionar câmera')
      }

      const newCameraData = await response.json()
      setCameras(prev => [...prev, newCameraData])
      setNewCamera({ name: "", location: "", rtspUrl: "", keywords: "" })

      toast({
        title: "Câmera adicionada",
        description: `${newCameraData.name} foi adicionada com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao adicionar câmera:', error)
      toast({
        title: "Erro",
        description: "Falha ao adicionar a câmera",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCamera = (camera: CameraData) => {
    setEditingCamera(camera.id)
    setEditForm({
      name: camera.name,
      location: camera.location,
      rtspUrl: camera.rtspUrl,
      keywords: camera.keywords,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingCamera || !editForm.name || !editForm.rtspUrl) {
      toast({
        title: "Erro",
        description: "Nome e URL RTSP são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)
    try {
      const response = await fetch(`/api/cameras/${editingCamera}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          location: editForm.location,
          rtspUrl: editForm.rtspUrl,
          keywords: Array.isArray(editForm.keywords)
            ? editForm.keywords
            : typeof editForm.keywords === 'string'
            ? editForm.keywords.split(",").map((k: string) => k.trim()).filter((k: string) => k)
            : [],
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar câmera')
      }

      const updatedCamera = await response.json()
      setCameras(prev => prev.map(cam => 
        cam.id === editingCamera ? updatedCamera : cam
      ))

      setEditingCamera(null)
      setEditForm({})

      toast({
        title: "Câmera atualizada",
        description: `${updatedCamera.name} foi atualizada com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao atualizar câmera:', error)
      toast({
        title: "Erro",
        description: "Falha ao atualizar a câmera",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCamera(null)
    setEditForm({})
  }

  const handleDeleteCamera = async (id: string) => {
    try {
      const response = await fetch(`/api/cameras/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Falha ao remover câmera')
      }

      setCameras(prev => prev.filter(c => c.id !== id))
      toast({
        title: "Câmera removida",
        description: "Câmera foi removida do sistema",
      })
    } catch (error) {
      console.error('Erro ao remover câmera:', error)
      toast({
        title: "Erro",
        description: "Falha ao remover a câmera",
        variant: "destructive",
      })
    }
  }

  // Funções para gerenciar usuários
  const handleEditUser = (user: UserData) => {
    setEditingUser(user.id)
    setEditUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: "", // Não mostramos a senha atual
    })
  }

  const handleSaveUserEdit = async () => {
    if (!editingUser || !editUserForm.name || !editUserForm.email) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsEditingUser(true)
    try {
      const response = await fetch(`/api/users/${editingUser}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editUserForm.name,
          email: editUserForm.email,
          role: editUserForm.role,
          status: editUserForm.status,
          ...(editUserForm.password && { password: editUserForm.password }), // Só envia senha se foi preenchida
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao atualizar usuário')
      }

      const updatedUser = await response.json()
      setUsers(prev => prev.map(user => 
        user.id === editingUser ? updatedUser : user
      ))

      setEditingUser(null)
      setEditUserForm({})

      toast({
        title: "Usuário atualizado",
        description: `${updatedUser.name} foi atualizado com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao atualizar o usuário",
        variant: "destructive",
      })
    } finally {
      setIsEditingUser(false)
    }
  }

  const handleCancelUserEdit = () => {
    setEditingUser(null)
    setEditUserForm({})
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao remover usuário')
      }

      setUsers(prev => prev.filter(u => u.id !== id))
      toast({
        title: "Usuário removido",
        description: "Usuário foi removido do sistema",
      })
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao remover o usuário",
        variant: "destructive",
      })
    }
  }

  // Função para salvar configurações do sistema
  const handleSaveSystemConfig = async () => {
    if (!systemConfig) return

    setIsLoadingConfig(true)
    try {
      // Se há uma API Key, validar primeiro
      if (systemConfig.speechApiKey) {
        toast({
          title: "Validando API Key",
          description: "Testando conexão com Google Speech API...",
        })

        const validateResponse = await fetch('/api/validate-speech-key', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey: systemConfig.speechApiKey }),
        })

        const validateResult = await validateResponse.json()

        if (!validateResult.valid) {
          console.error('Erro de validação detalhado:', validateResult)
          
          let description = validateResult.error || "Erro ao validar Google Speech API Key"
          if (validateResult.diagnostics && validateResult.diagnostics.length > 0) {
            description += "\n\n" + validateResult.diagnostics.join("\n")
          }
          
          toast({
            title: "❌ API Key com Problema",
            description: description,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "API Key Válida",
          description: "Google Speech API conectada com sucesso",
        })
      }

      const response = await fetch('/api/system-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemConfig),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao salvar configurações')
      }

      const updatedConfig = await response.json()
      setSystemConfig(updatedConfig)

      toast({
        title: "Configurações salvas",
        description: systemConfig.speechApiKey 
          ? "Configurações salvas! Google Speech API ativo." 
          : "Configurações salvas! Usando reconhecimento do navegador.",
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar as configurações",
        variant: "destructive",
      })
    } finally {
      setIsLoadingConfig(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">Administração do Sistema</h1>
        </div>

        <Tabs defaultValue="cameras" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cameras">Câmeras</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="cameras" className="space-y-6">
            {/* Adicionar nova câmera */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Adicionar Nova Câmera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">
                      Nome da Câmera
                    </Label>
                    <Input
                      id="name"
                      value={newCamera.name}
                      onChange={(e) => setNewCamera({ ...newCamera, name: e.target.value })}
                      placeholder="Ex: Câmera Ipanema"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-white">
                      Localização
                    </Label>
                    <Input
                      id="location"
                      value={newCamera.location}
                      onChange={(e) => setNewCamera({ ...newCamera, location: e.target.value })}
                      placeholder="Ex: Zona Sul"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rtspUrl" className="text-white">
                    URL RTSP
                  </Label>
                  <Input
                    id="rtspUrl"
                    value={newCamera.rtspUrl}
                    onChange={(e) => setNewCamera({ ...newCamera, rtspUrl: e.target.value })}
                    placeholder="rtsp://Porto:Porto@9000@168.90.225.117:554/cam/realmonitor?channel=10&subtype=0"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="keywords" className="text-white">
                    Palavras-chave (separadas por vírgula)
                  </Label>
                  <Input
                    id="keywords"
                    value={newCamera.keywords}
                    onChange={(e) => setNewCamera({ ...newCamera, keywords: e.target.value })}
                    placeholder="ipanema, zona sul, praia"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button onClick={handleAddCamera} className="w-full" disabled={isLoading}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoading ? "Adicionando..." : "Adicionar Câmera"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de câmeras */}
            <div className="grid gap-4">
              {cameras.map((camera) => (
                <Card key={camera.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    {editingCamera === camera.id ? (
                      // Modo de edição
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white text-sm">Nome da Câmera</Label>
                            <Input
                              value={editForm.name || ""}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-white text-sm">Localização</Label>
                            <Input
                              value={editForm.location || ""}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-white text-sm">URL RTSP</Label>
                          <Input
                            value={editForm.rtspUrl || ""}
                            onChange={(e) => setEditForm({ ...editForm, rtspUrl: e.target.value })}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-white text-sm">Palavras-chave</Label>
                          <Input
                            value={Array.isArray(editForm.keywords) 
                              ? editForm.keywords.join(", ") 
                              : (editForm.keywords as string) || ""}
                            onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                            placeholder="separadas por vírgula"
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                            disabled={isEditing}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleSaveEdit}
                            disabled={isEditing}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {isEditing ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Modo de visualização
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Camera className="h-5 w-5 text-blue-400" />
                            <div>
                              <h3 className="font-semibold text-white">{camera.name}</h3>
                              <p className="text-sm text-gray-400">{camera.location}</p>
                              <p className="text-xs text-gray-500 font-mono">{camera.rtspUrl}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {camera.keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditCamera(camera)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteCamera(camera.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* Adicionar novo usuário */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Plus className="mr-2 h-5 w-5" />
                  Adicionar Novo Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userName" className="text-white">
                      Nome Completo
                    </Label>
                    <Input
                      id="userName"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userEmail" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="Ex: joao@globo.com"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userPassword" className="text-white">
                      Senha
                    </Label>
                    <Input
                      id="userPassword"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Senha inicial"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="userRole" className="text-white">
                      Função
                    </Label>
                    <select
                      id="userRole"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "ADMIN" | "OPERATOR" })}
                      className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2 border"
                    >
                      <option value="OPERATOR">Operador</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>
                <Button onClick={handleAddUser} className="w-full" disabled={isLoadingUser}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isLoadingUser ? "Adicionando..." : "Adicionar Usuário"}
                </Button>
              </CardContent>
            </Card>

            {/* Lista de usuários */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Usuários do Sistema ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="p-4 bg-gray-700 rounded-lg">
                        {editingUser === user.id ? (
                          // Modo de edição
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-white text-sm">Nome Completo</Label>
                                <Input
                                  value={editUserForm.name || ""}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                                  className="bg-gray-600 border-gray-500 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-white text-sm">Email</Label>
                                <Input
                                  type="email"
                                  value={editUserForm.email || ""}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                                  className="bg-gray-600 border-gray-500 text-white"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label className="text-white text-sm">Nova Senha (opcional)</Label>
                                <Input
                                  type="password"
                                  value={editUserForm.password || ""}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                                  placeholder="Deixe vazio para manter atual"
                                  className="bg-gray-600 border-gray-500 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-white text-sm">Função</Label>
                                <select
                                  value={editUserForm.role || "OPERATOR"}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as "ADMIN" | "OPERATOR" })}
                                  className="w-full bg-gray-600 border-gray-500 text-white rounded-md px-3 py-2 border"
                                >
                                  <option value="OPERATOR">Operador</option>
                                  <option value="ADMIN">Administrador</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-white text-sm">Status</Label>
                                <select
                                  value={editUserForm.status || "ACTIVE"}
                                  onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as "ACTIVE" | "INACTIVE" })}
                                  className="w-full bg-gray-600 border-gray-500 text-white rounded-md px-3 py-2 border"
                                >
                                  <option value="ACTIVE">Ativo</option>
                                  <option value="INACTIVE">Inativo</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleCancelUserEdit}
                                disabled={isEditingUser}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancelar
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={handleSaveUserEdit}
                                disabled={isEditingUser}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                {isEditingUser ? "Salvando..." : "Salvar"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Modo de visualização
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white">{user.name}</h3>
                                  <p className="text-sm text-gray-400">{user.email}</p>
                                  <p className="text-xs text-gray-500">
                                    Criado em: {formatDate(user.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={user.role === "ADMIN" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {user.role === "ADMIN" ? "Administrador" : "Operador"}
                              </Badge>
                              <Badge 
                                variant={user.status === "ACTIVE" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {user.status === "ACTIVE" ? "Ativo" : "Inativo"}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Configurações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="speechApiKey" className="text-white">
                    Google Speech API Key
                  </Label>
                  <Input
                    id="speechApiKey"
                    type="password"
                    value={systemConfig?.speechApiKey || ""}
                    onChange={(e) => setSystemConfig(prev => prev ? { ...prev, speechApiKey: e.target.value } : null)}
                    placeholder="Digite sua chave da API do Google Speech"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="mediaMtxUrl" className="text-white">
                    MediaMTX Server URL
                  </Label>
                  <Input
                    id="mediaMtxUrl"
                    value={systemConfig?.mediaMtxUrl || ""}
                    onChange={(e) => setSystemConfig(prev => prev ? { ...prev, mediaMtxUrl: e.target.value } : null)}
                    placeholder="http://localhost:8888"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="voiceThreshold" className="text-white">
                    Limite de Confiança do Reconhecimento de Voz (%)
                  </Label>
                  <Input
                    id="voiceThreshold"
                    type="number"
                    value={systemConfig?.voiceThreshold || 85}
                    onChange={(e) => setSystemConfig(prev => prev ? { ...prev, voiceThreshold: parseInt(e.target.value) || 85 } : null)}
                    placeholder="85"
                    min="0"
                    max="100"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSwitchEnabled"
                    checked={systemConfig?.autoSwitchEnabled || false}
                    onChange={(e) => setSystemConfig(prev => prev ? { ...prev, autoSwitchEnabled: e.target.checked } : null)}
                    className="rounded"
                  />
                  <Label htmlFor="autoSwitchEnabled" className="text-white">
                    Habilitar troca automática de câmeras por voz
                  </Label>
                </div>
                <Button 
                  onClick={handleSaveSystemConfig} 
                  className="w-full"
                  disabled={isLoadingConfig}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoadingConfig ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
