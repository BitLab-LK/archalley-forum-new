/**
 * Description Counter Component
 * Textarea with word count validation (50-200 words)
 */

'use client';

import { countWords } from '@/lib/azure-blob-submission-upload';

interface DescriptionCounterProps {
  value: string;
  onChange: (value: string) => void;
  minWords?: number;
  maxWords?: number;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}

export function DescriptionCounter({
  value,
  onChange,
  minWords = 50,
  maxWords = 200,
  required = false,
  disabled = false,
  error,
}: DescriptionCounterProps) {
  const wordCount = countWords(value);
  const isUnderMin = wordCount < minWords;
  const isOverMax = wordCount > maxWords;
  const isValid = !isUnderMin && !isOverMax;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Description {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isOverMax
                ? 'text-red-500'
                : isUnderMin
                ? 'text-orange-500'
                : 'text-green-600'
            }`}
          >
            {wordCount} / {minWords}-{maxWords} words
          </span>
          {isValid && wordCount >= minWords && (
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={6}
        className={`
          w-full px-4 py-3 border rounded-lg resize-none
          focus:outline-none focus:ring-2 transition-colors
          ${
            error || isOverMax
              ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
              : isUnderMin && value.length > 0
              ? 'border-orange-300 focus:ring-orange-200 focus:border-orange-500'
              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
        placeholder="Describe your design, inspiration, materials used, and creative process... (50-200 words)"
      />

      {/* Word count progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            isOverMax
              ? 'bg-red-500'
              : isUnderMin
              ? 'bg-orange-500'
              : 'bg-green-600'
          }`}
          style={{
            width: `${Math.min((wordCount / maxWords) * 100, 100)}%`,
          }}
        />
      </div>

      {/* Validation messages */}
      {error ? (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      ) : isOverMax ? (
        <p className="text-sm text-red-500">
          Description exceeds maximum word count ({wordCount - maxWords} words over)
        </p>
      ) : isUnderMin && value.length > 0 ? (
        <p className="text-sm text-orange-500">
          Add {minWords - wordCount} more words to meet minimum requirement
        </p>
      ) : isValid && wordCount >= minWords ? (
        <p className="text-sm text-green-600">✓ Word count meets requirements</p>
      ) : (
        <p className="text-sm text-gray-500">
          Write between {minWords} and {maxWords} words about your design
        </p>
      )}
    </div>
  );
}
