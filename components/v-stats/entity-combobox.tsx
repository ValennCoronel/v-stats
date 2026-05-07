"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Clock,
  ChevronDown,
  ImageIcon,
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { EntityData } from "./entity-form-dialog"

interface EntityComboBoxProps {
  label: string
  placeholder: string
  value: EntityData | null
  onChange: (entity: EntityData | null) => void
  entities: EntityData[]
  recentEntities: EntityData[]
  onSearch: (query: string) => void
  searchQuery: string
  onCreateNew: () => void
  onEdit: (entity: EntityData) => void
  onDelete: (entity: EntityData) => void
  entityTypeLabel: string // "equipo" or "torneo"
}

export function EntityComboBox({
  label,
  placeholder,
  value,
  onChange,
  entities,
  recentEntities,
  onSearch,
  searchQuery,
  onCreateNew,
  onEdit,
  onDelete,
  entityTypeLabel,
}: EntityComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync input display value with selection
  useEffect(() => {
    if (value && !isOpen) {
      setInputValue(value.name)
    }
  }, [value, isOpen])

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        // Restore selected name if dropdown closes without change
        if (value) setInputValue(value.name)
        else setInputValue("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    onSearch(val)
    if (!isOpen) setIsOpen(true)
  }

  const handleFocus = () => {
    setIsOpen(true)
    if (value) {
      // Clear to show all results + recents
      setInputValue("")
      onSearch("")
    }
  }

  const handleSelect = (entity: EntityData) => {
    onChange(entity)
    setInputValue(entity.name)
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      if (value) setInputValue(value.name)
      else setInputValue("")
      inputRef.current?.blur()
    }
  }

  const showRecents = !searchQuery && recentEntities.length > 0
  const filteredEntities = searchQuery
    ? entities.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entities

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  return (
    <div className="space-y-2 relative" ref={containerRef}>
      <Label className="text-foreground">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {isOpen ? (
            <Search className="h-4 w-4" />
          ) : value?.logoUrl ? (
            <div className="relative h-5 w-5 rounded overflow-hidden">
              <Image
                src={value.logoUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="bg-input border-border pl-10 pr-4"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          <ScrollArea className="max-h-[280px]">
            {/* Recent section */}
            {showRecents && (
              <>
                <div className="px-3 py-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Clock className="h-3 w-3" />
                  Recientes
                </div>
                {recentEntities.map((entity) => (
                  <EntityItem
                    key={`recent-${entity.id}`}
                    entity={entity}
                    isSelected={value?.id === entity.id}
                    onSelect={handleSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    getInitials={getInitials}
                  />
                ))}
                <Separator className="my-1" />
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Todos
                </div>
              </>
            )}

            {/* Filtered/All results */}
            {filteredEntities.length > 0 ? (
              filteredEntities.map((entity) => (
                <EntityItem
                  key={entity.id}
                  entity={entity}
                  isSelected={value?.id === entity.id}
                  onSelect={handleSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  getInitials={getInitials}
                />
              ))
            ) : (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? `No se encontró "${searchQuery}"`
                  : `No hay ${entityTypeLabel}s registrados`}
              </div>
            )}
          </ScrollArea>

          {/* Create new */}
          <Separator />
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsOpen(false)
              onCreateNew()
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Crear nuevo {entityTypeLabel}</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Individual Item ──────────────────────────────────────────

interface EntityItemProps {
  entity: EntityData
  isSelected: boolean
  onSelect: (entity: EntityData) => void
  onEdit: (entity: EntityData) => void
  onDelete: (entity: EntityData) => void
  getInitials: (name: string) => string
}

function EntityItem({
  entity,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  getInitials,
}: EntityItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-accent/50 text-foreground"
      )}
    >
      {/* Clickable main area */}
      <button
        type="button"
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        onClick={() => onSelect(entity)}
      >
        {/* Avatar / Logo */}
        <div className="relative h-8 w-8 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {entity.logoUrl ? (
            <Image
              src={entity.logoUrl}
              alt={entity.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {getInitials(entity.name)}
            </span>
          )}
        </div>
        <span className="truncate text-sm font-medium">{entity.name}</span>
      </button>

      {/* Edit / Delete — visible on hover */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(entity)
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(entity)
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
