import { Bell, Search } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  title: string
  subtitle?: string
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, onSearch, searchPlaceholder, actions }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <header className="sticky top-0 z-30 glass border-b border-white/5 px-8 py-5">
      <div className="flex items-center justify-between">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-surface-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {onSearch && (
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder={searchPlaceholder || 'Ara...'}
                className="glass-input pl-10 w-72 py-2.5 text-sm"
              />
            </div>
          )}

          <button className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-200">
            <Bell size={18} className="text-surface-300" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-surface-900" />
          </button>

          {actions}
        </div>
      </div>
    </header>
  )
}
