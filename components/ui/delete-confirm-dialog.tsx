'use client';

/**
 * Delete Confirmation Dialog Component
 * Professional dialog for confirming bulk deletion of registrations
 * Includes warning indicators and clear action buttons
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  count,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Delete Registrations</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            This action cannot be undone. The selected registration{count !== 1 ? 's' : ''} will be permanently deleted from the database.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 my-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 mb-2">
                You are about to delete:
              </p>
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-2xl font-bold text-red-600 text-center">
                  {count} Registration{count !== 1 ? 's' : ''}
                </p>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-red-800">
                <li>• All registration data will be lost</li>
                <li>• Payment records will be deleted</li>
                <li>• Submission files will be removed</li>
                <li>• This action is <strong>PERMANENT</strong></li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <Trash2 className="w-4 h-4 mr-2 animate-pulse" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {count} Registration{count !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
