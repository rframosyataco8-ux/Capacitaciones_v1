import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

const ToastContext = createContext<{
  toast: (message: string, kind?: ToastKind) => void
}>({ toast: () => {} })

let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++seq
    setItems((prev) => [...prev.slice(-4), { id, kind, message }])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  function dismiss(id: number) {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }

  const icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  }

  const colors = {
    success: { bg: 'var(--success-soft)', fg: 'var(--success)', border: 'var(--success)' },
    error: { bg: 'var(--danger-soft)', fg: 'var(--danger)', border: 'var(--danger)' },
    info: { bg: 'var(--primary-soft)', fg: 'var(--primary-text)', border: 'var(--primary)' },
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"
        style={{ maxWidth: 360 }}
      >
        {items.map((t) => {
          const Icon = icon[t.kind]
          const c = colors[t.kind]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-md)',
                borderLeft: `3px solid ${c.border}`,
              }}
            >
              <Icon size={18} style={{ color: c.fg, marginTop: 1 }} className="shrink-0" />
              <p className="text-[13px] font-medium flex-1 leading-snug" style={{ color: 'var(--text)' }}>
                {t.message}
              </p>
              <button
                type="button"
                className="btn-icon shrink-0 -mr-1 -mt-0.5"
                style={{ color: 'var(--text-muted)', width: 28, height: 28 }}
                onClick={() => dismiss(t.id)}
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
