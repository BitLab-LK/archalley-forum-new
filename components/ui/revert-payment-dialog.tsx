'use client';

/**
 * Revert Payment Dialog Component
 * Professional dialog for reverting approved/rejected payments back to PENDING
 * Includes optional reason textarea with character counter
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RevertPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  registrationNumber?: string;
}

export function RevertPaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  registrationNumber,
}: RevertPaymentDialogProps) {
  const [reason, setReason] = useState('');
  const maxLength = 500;

  // Reset reason when dialog opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(reason.trim());
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Revert Payment</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            This will revert the payment status back to <span className="font-semibold text-amber-600">PENDING</span>. 
            The registration status will also be updated, and confirmation timestamp will be cleared.
          </DialogDescription>
        </DialogHeader>

        {registrationNumber && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-gray-600">
              Registration: <span className="font-mono font-semibold text-black">{registrationNumber}</span>
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="revert-reason" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Reason for Reverting <span className="text-xs text-gray-500">(Optional)</span>
          </label>
          <Textarea
            id="revert-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, maxLength))}
            placeholder="e.g., Duplicate payment, incorrect bank transfer, mistake in verification..."
            className="min-h-[120px] resize-none"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between text-xs">
            <p className="text-gray-500">
              This reason will be stored in the audit trail for admin reference
            </p>
            <span className={`font-medium ${reason.length >= maxLength ? 'text-red-600' : 'text-gray-400'}`}>
              {reason.length}/{maxLength}
            </span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Important:</p>
            <ul className="space-y-1 text-xs">
              <li>• Customer will NOT receive an email notification</li>
              <li>• Admin can re-approve or reject this payment again</li>
              <li>• This action is reversible</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Reverting...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Revert to Pending
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
