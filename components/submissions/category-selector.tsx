/**
 * Category Selector Component
 * Allows users to select between DIGITAL and PHYSICAL submission categories
 */

'use client';

import { SubmissionCategory } from '@prisma/client';

interface CategorySelectorProps {
  value: SubmissionCategory | null;
  onChange: (category: SubmissionCategory) => void;
  disabled?: boolean;
  error?: string;
}

export function CategorySelector({
  value,
  onChange,
  disabled = false,
  error
}: CategorySelectorProps) {
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Submission Category <span className="text-red-500">*</span>
        </label>
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>
      
      <p className="text-sm text-gray-600">
        Choose whether your submission is a digital design or a physical design
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Digital Category */}
        <button
          type="button"
          onClick={() => !disabled && onChange('DIGITAL' as SubmissionCategory)}
          disabled={disabled}
          className={`
            relative p-6 border-2 rounded-lg transition-all duration-200
            ${value === 'DIGITAL' 
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
              : 'border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'border-red-300' : ''}
          `}
        >
          {/* Checkmark */}
          {value === 'DIGITAL' && (
            <div className="absolute top-3 right-3">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="text-center space-y-2">
            <div className="text-4xl">💻</div>
            <h3 className="font-semibold text-lg text-gray-900">Digital Category</h3>
            <p className="text-sm text-gray-600">
              Computer-generated designs created using digital tools
            </p>
          </div>
        </button>
        
        {/* Physical Category */}
        <button
          type="button"
          onClick={() => !disabled && onChange('PHYSICAL' as SubmissionCategory)}
          disabled={disabled}
          className={`
            relative p-6 border-2 rounded-lg transition-all duration-200
            ${value === 'PHYSICAL' 
              ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
              : 'border-gray-300 bg-white hover:border-green-300 hover:bg-green-50/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'border-red-300' : ''}
          `}
        >
          {/* Checkmark */}
          {value === 'PHYSICAL' && (
            <div className="absolute top-3 right-3">
              <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="text-center space-y-2">
            <div className="text-4xl">🎨</div>
            <h3 className="font-semibold text-lg text-gray-900">Physical Category</h3>
            <p className="text-sm text-gray-600">
              Hand-crafted designs made with physical materials
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
