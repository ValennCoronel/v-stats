"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Trophy, 
  Users, 
  History, 
  Settings, 
  LogOut,
  Activity,
  Menu,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/lib/stores/auth-store"

const navItems = [
  { href: "/dashboard", label: "Stats", icon: BarChart3 },
  { href: "/match", label: "Match", icon: Trophy },
  { href: "/team", label: "Team", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Activity className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-sidebar-foreground">V-Stats</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-4 space-y-4">
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-4 py-2">
          <Label htmlFor="dark-mode" className="text-sm text-sidebar-foreground/70">
            Dark Mode
          </Label>
          <Switch
            id="dark-mode"
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </Button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile trigger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-64 flex-col border-r border-sidebar-border">
        <SidebarContent />
      </aside>
    </>
  )
}
