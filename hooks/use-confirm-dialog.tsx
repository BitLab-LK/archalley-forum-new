"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogState {
  isOpen: boolean
  title: string
  description: string
  onConfirm: () => void
  onCancel: () => void
  confirmText: string
  cancelText: string
  variant: "default" | "destructive"
}

let setDialogState: (state: ConfirmDialogState | null) => void

export function useConfirmDialog() {
  const confirm = ({
    title = "Confirm Action",
    description = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default" as const
  }: {
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
  } = {}) => {
    return new Promise<boolean>((resolve) => {
      console.log("Confirmation dialog requested:", title) // Debug log
      setDialogState({
        isOpen: true,
        title,
        description,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => {
          console.log("Dialog confirmed") // Debug log
          setDialogState(null)
          resolve(true)
        },
        onCancel: () => {
          console.log("Dialog cancelled") // Debug log
          setDialogState(null)
          resolve(false)
        }
      })
    })
  }

  return { confirm }
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogStateInternal] = useState<ConfirmDialogState | null>(null)
  
  // Set the global setter
  setDialogState = setDialogStateInternal

  return (
    <>
      {children}
      {dialogState?.isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999999]"
          style={{ zIndex: 9999999 }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              dialogState.onCancel()
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full z-[9999999] overflow-hidden"
            style={{ zIndex: 9999999 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with close button */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {dialogState.title}
              </h3>
              <button
                onClick={dialogState.onCancel}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Close dialog"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {dialogState.description}
              </p>
              
              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={dialogState.onCancel} className="px-4 py-2">
                  {dialogState.cancelText}
                </Button>
                <Button 
                  variant={dialogState.variant} 
                  onClick={dialogState.onConfirm}
                  className="px-4 py-2"
                >
                  {dialogState.confirmText}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
