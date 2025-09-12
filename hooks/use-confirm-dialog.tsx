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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              dialogState.onCancel()
            }
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 z-[9999999]"
            style={{ zIndex: 9999999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {dialogState.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dialogState.description}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={dialogState.onCancel}>
                {dialogState.cancelText}
              </Button>
              <Button 
                variant={dialogState.variant} 
                onClick={dialogState.onConfirm}
              >
                {dialogState.confirmText}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
