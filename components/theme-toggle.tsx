"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("neon_theme")
    if (stored === "light") {
      setTheme("light")
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    } else {
      setTheme("dark")
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    localStorage.setItem("neon_theme", next)
    if (next === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.classList.add("light")
    }
  }

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Temayı Değiştir"
        className={`size-9 rounded-xl text-muted-foreground ${className}`}
      >
        <Moon className="size-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={theme === "dark" ? "Aydınlık Temaya Geç" : "Karanlık Temaya Geç"}
      aria-label="Temayı Değiştir"
      className={`relative size-9 rounded-xl transition-all duration-200 border border-transparent hover:border-border/70 hover:bg-muted/80 text-muted-foreground hover:text-foreground ${className}`}
    >
      {theme === "dark" ? (
        <Sun className="size-4.5 text-amber-400 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="size-4.5 text-indigo-500 transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  )
}
