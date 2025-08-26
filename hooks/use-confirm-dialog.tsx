"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      setDialogState({
        isOpen: true,
        title,
        description,
        confirmText,
        cancelText,
        variant,
        onConfirm: () => {
          setDialogState(null)
          resolve(true)
        },
        onCancel: () => {
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
      <Dialog open={dialogState?.isOpen || false} onOpenChange={(open) => {
        if (!open && dialogState) {
          dialogState.onCancel()
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{dialogState?.title}</DialogTitle>
            <DialogDescription>
              {dialogState?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={dialogState?.onCancel}>
              {dialogState?.cancelText}
            </Button>
            <Button 
              variant={dialogState?.variant} 
              onClick={dialogState?.onConfirm}
            >
              {dialogState?.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
