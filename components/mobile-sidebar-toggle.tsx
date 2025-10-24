'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

interface MobileSidebarToggleProps {
  children: React.ReactNode;
}

export function MobileSidebarToggle({ children }: MobileSidebarToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button - fixed position, high z-index */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-[60] bg-white dark:bg-gray-800 shadow-lg border-2 lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile sidebar overlay - only show when open */}
      {isOpen && (
        <>
          {/* Background overlay */}
          <div 
            className="fixed inset-0 z-[50] bg-black bg-opacity-50 lg:hidden" 
            onClick={() => setIsOpen(false)} 
          />

          {/* Sidebar content - slide in from right */}
          <div className={`
            fixed inset-y-0 right-0 z-[55] w-80 max-w-[85vw]
            bg-white dark:bg-gray-900 shadow-xl
            transform transition-transform duration-300 ease-in-out
            overflow-y-auto
            lg:hidden
          `}>
            <div className="p-4 pt-16">
              {/* Add top padding to avoid toggle button */}
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
}