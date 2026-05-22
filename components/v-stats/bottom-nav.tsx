"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, BarChart3, Settings, Trophy } from "lucide-react"
import { useProfileStore } from "@/lib/stores/profile-store"

const barlow = { fontFamily: "var(--font-heading, 'Barlow Condensed', sans-serif)" }

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/settings", label: "Config", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const activeProfile = useProfileStore((s) => s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0] || null)
  const color = activeProfile?.color ?? "#1E6FD9"

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] px-6 py-3 flex justify-around z-50">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1"
            style={{ color: isActive ? color : "#64748B" }}
          >
            <Icon className="size-6" />
            <span style={{ ...barlow, fontSize: "12px" }}>{item.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
