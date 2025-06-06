"use client"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Video, Camera, Grid3X3, Settings, Archive, LogOut } from "lucide-react"

export function Header() {
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/cameras" className="flex items-center space-x-2">
            <Video className="h-8 w-8 text-blue-400" />
            <span className="text-xl font-bold text-white">Sistema Globo</span>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link href="/cameras">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <Camera className="mr-2 h-4 w-4" />
                Câmeras
              </Button>
            </Link>
            <Link href="/multiview">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <Grid3X3 className="mr-2 h-4 w-4" />
                Multiview
              </Button>
            </Link>
            <Link href="/admin">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Button>
            </Link>
            <Link href="/backups">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                <Archive className="mr-2 h-4 w-4" />
                Backups
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">Bem-vindo, {session?.user?.name || session?.user?.email}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt="Avatar" />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
