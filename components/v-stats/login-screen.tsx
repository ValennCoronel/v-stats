"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "sonner"

export function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isRegister, setIsRegister] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((s) => s.login)
  const register = useAuthStore((s) => s.register)
  const isLoading = useAuthStore((s) => s.isLoading)

  const redirectTo = searchParams.get("redirect") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isRegister) {
      const result = await register(email, password, displayName)
      if (result.success) {
        toast.success("Cuenta creada exitosamente")
        router.push(redirectTo)
      } else {
        toast.error(result.error || "Error al registrarse")
      }
    } else {
      const result = await login(email, password)
      if (result.success) {
        router.push(redirectTo)
      } else {
        toast.error(result.error || "Error al iniciar sesión")
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Activity className="h-9 w-9 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              {isRegister ? "Crear cuenta" : "Bienvenido"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isRegister
                ? "Registrate en V-Stats para empezar"
                : "Iniciá sesión en tu cuenta de V-Stats"
              }
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-foreground">Nombre</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Tu nombre"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-input border-border"
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresá tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-input border-border pr-10"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0a67ec] hover:bg-[#0a67ec]/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isRegister ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setIsRegister(!isRegister)}
                disabled={isLoading}
              >
                {isRegister ? "Iniciá sesión" : "Creá una"}
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
