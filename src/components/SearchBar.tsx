"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, useEffect } from "react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "Search apps..." }: SearchBarProps) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(debouncedValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [debouncedValue, onChange])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        type="text"
        placeholder={placeholder}
        value={debouncedValue}
        onChange={(e) => setDebouncedValue(e.target.value)}
        className="pl-10"
      />
    </div>
  )
}

