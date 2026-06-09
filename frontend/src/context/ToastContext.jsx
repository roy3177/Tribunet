/**
 * @author Roy Meoded
 * @author Yarin Keshet
 * @author Tomer Gal
 *
 * @date 08-06-2026
 *
 * ToastContext.jsx — Toast Notification Context Provider
 * =======================================================
 * Provides a global toast notification system to the app via React Context.
 *
 * Exposed via useToast():
 *   success(msg) — shows a green success toast for 3 seconds.
 *   error(msg)   — shows a red error toast for 3 seconds.
 *   toast        — the current active toast object { message, type } or null.
 *   clear()      — manually dismisses the active toast.
 *
 * Only one toast is active at a time; calling success/error while a toast
 * is visible replaces it immediately.
 */
import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

// Provider that manages a single toast state with an auto-dismiss timer.
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  // Displays a toast with the given message and type, auto-dismissing after 3 seconds.
  const show = useCallback((message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{
      success: (msg) => show(msg, 'success'),
      error:   (msg) => show(msg, 'error'),
      toast,
      clear:   () => setToast(null),
    }}>
      {children}
    </ToastContext.Provider>
  )
}

// Custom hook for consuming ToastContext throughout the app.
export function useToast() {
  return useContext(ToastContext)
}
