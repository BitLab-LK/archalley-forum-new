'use client';

/**
 * Reject Payment Dialog Component
 * Professional dialog for rejecting payments with custom reason
 * Shows preview of email that will be sent to customer
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, AlertCircle, Mail } from 'lucide-react';

interface RejectPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  registrationNumber?: string;
  customerName?: string;
}

export function RejectPaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  registrationNumber,
  customerName,
}: RejectPaymentDialogProps) {
  const [reason, setReason] = useState('');
  const maxLength = 500;

  // Reset reason when dialog opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      return; // Validation: minimum 10 characters
    }
    onConfirm(reason.trim());
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  const isValid = reason.trim().length >= 10;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Reject Payment</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Provide a clear reason for rejecting this payment. The customer will receive an email with your explanation.
          </DialogDescription>
        </DialogHeader>

        {registrationNumber && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Registration Number</p>
                <p className="font-mono font-semibold text-black">{registrationNumber}</p>
              </div>
              {customerName && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-black">{customerName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="reject-reason" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            Rejection Reason <span className="text-xs text-red-600">(Required - Min 10 characters)</span>
          </label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, maxLength))}
            placeholder="e.g., Bank transfer proof is unclear/invalid, amount doesn't match, wrong account details, payment not received..."
            className="min-h-[120px] resize-none"
            disabled={isLoading}
          />
          <div className="flex items-center justify-between text-xs">
            <p className={`${isValid ? 'text-green-600' : 'text-gray-500'}`}>
              {isValid ? '✓ Reason is valid' : `Need ${Math.max(0, 10 - reason.trim().length)} more characters`}
            </p>
            <span className={`font-medium ${reason.length >= maxLength ? 'text-red-600' : 'text-gray-400'}`}>
              {reason.length}/{maxLength}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex gap-2">
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Email Preview:</p>
              <div className="bg-white rounded p-2 border border-blue-200 text-xs text-gray-600">
                <p className="mb-2">Dear {customerName || 'Customer'},</p>
                <p className="mb-2">
                  Your payment for registration <strong>{registrationNumber}</strong> has been rejected.
                </p>
                {reason.trim() && (
                  <div className="bg-amber-50 border border-amber-300 rounded p-2 my-2">
                    <p className="font-semibold text-amber-900 mb-1">Reason:</p>
                    <p className="text-amber-800">{reason.trim()}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Generic reasons will also be included for guidance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">Important:</p>
            <ul className="space-y-1 text-xs">
              <li>• Registration status will change to <strong>CANCELLED</strong></li>
              <li>• Payment status will be marked as <strong>FAILED</strong></li>
              <li>• Customer will receive rejection email immediately</li>
              <li>• This can be reverted if needed</li>
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
            disabled={isLoading || !isValid}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <X className="w-4 h-4 mr-2 animate-pulse" />
                Rejecting...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Reject Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
