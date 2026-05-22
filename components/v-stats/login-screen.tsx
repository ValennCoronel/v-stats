"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/stores/auth-store"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

export function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1
          className="mb-2"
          style={{
            ...barlow,
            fontSize: "56px",
            fontWeight: 700,
            lineHeight: 1.2,
            background: "linear-gradient(135deg, #0D1F33 0%, #1E6FD9 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          V-Stats
        </h1>
        <p
          style={{
            ...barlow,
            fontSize: "12px",
            letterSpacing: "2px",
            color: "#1E6FD9",
            textTransform: "uppercase",
          }}
        >
          Datos que ganan partidos
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {isRegister && (
          <Input
            type="text"
            placeholder="Nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-12 bg-white border-[#E2E8F0]"
            disabled={isLoading}
          />
        )}
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 bg-white border-[#E2E8F0]"
          required
          disabled={isLoading}
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 bg-white border-[#E2E8F0]"
          required
          minLength={6}
          disabled={isLoading}
        />

        <Button
          type="submit"
          className="w-full h-12 bg-[#1E6FD9] hover:bg-[#1557B0] text-white"
          style={{ ...barlow, letterSpacing: "1px" }}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {isRegister ? "CREAR CUENTA" : "INICIAR SESIÓN"}
        </Button>

        <Button
          type="button"
          onClick={() => {
            // Skip login - navigate directly
            router.push(redirectTo)
          }}
          variant="outline"
          className="w-full h-12 border-[#1E6FD9] text-[#1E6FD9] hover:bg-[#1E6FD9]/5"
          style={{ ...barlow, letterSpacing: "1px" }}
          disabled={isLoading}
        >
          CONTINUAR SIN CUENTA
        </Button>

        <div className="text-center pt-4">
          <button
            type="button"
            className="text-sm text-[#64748B] hover:text-[#1E6FD9]"
            onClick={() => setIsRegister(!isRegister)}
            disabled={isLoading}
          >
            {isRegister ? (
              <>¿Ya tenés cuenta? <span className="text-[#1E6FD9]">Iniciá sesión</span></>
            ) : (
              <>¿No tenés cuenta? <span className="text-[#1E6FD9]">Registrate</span></>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
