/**
 * Vote Button Component
 * Heart icon with vote count, supports optimistic updates
 */

'use client';

import { useState, useTransition } from 'react';
import { Heart } from 'lucide-react';
import { toggleVote } from '@/app/actions/voting-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface VoteButtonProps {
  registrationNumber: string;
  initialVoteCount: number;
  initialHasVoted: boolean;
  isAuthenticated: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'compact';
}

export function VoteButton({
  registrationNumber,
  initialVoteCount,
  initialHasVoted,
  isAuthenticated,
  size = 'md',
  showCount = true,
  variant = 'default',
}: VoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Optimistic state
  const [optimisticVoteCount, setOptimisticVoteCount] = useState(initialVoteCount);
  const [optimisticHasVoted, setOptimisticHasVoted] = useState(initialHasVoted);

  const handleVote = async () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Optimistic update
    const newHasVoted = !optimisticHasVoted;
    const newVoteCount = optimisticVoteCount + (newHasVoted ? 1 : -1);
    
    setOptimisticHasVoted(newHasVoted);
    setOptimisticVoteCount(newVoteCount);

    // Server action
    startTransition(async () => {
      const result = await toggleVote(registrationNumber);

      if (!result.success) {
        // Revert on error
        setOptimisticHasVoted(initialHasVoted);
        setOptimisticVoteCount(initialVoteCount);
        
        if (result.requiresAuth) {
          router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
        } else {
          toast.error(result.error || 'Failed to vote');
        }
      } else {
        // Update with server response
        setOptimisticVoteCount(result.voteCount || 0);
        setOptimisticHasVoted(result.hasVoted || false);
        
        if (result.hasVoted) {
          toast.success('Vote added!');
        } else {
          toast.success('Vote removed');
        }
      }
    });
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-7 w-7',
    lg: 'h-8 w-8',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleVote}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 transition-all ${
          isPending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
        }`}
        aria-label={optimisticHasVoted ? 'Remove vote' : 'Add vote'}
      >
        <Heart
          className={`${sizeClasses[size]} transition-all ${
            optimisticHasVoted
              ? 'fill-red-500 text-red-500'
              : 'text-gray-400 hover:text-red-400'
          }`}
        />
        {showCount && (
          <span className={`font-semibold ${textSizeClasses[size]} ${
            optimisticHasVoted ? 'text-red-500' : 'text-gray-600'
          }`}>
            {optimisticVoteCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      className={`
        group relative inline-flex items-center gap-2 px-4 py-2 rounded-full
        transition-all duration-200 border-2
        ${
          optimisticHasVoted
            ? 'bg-red-50 border-red-500 hover:bg-red-100'
            : 'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50'
        }
        ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}
      `}
      aria-label={optimisticHasVoted ? 'Remove vote' : 'Add vote'}
    >
      <Heart
        className={`${sizeClasses[size]} transition-all ${
          optimisticHasVoted
            ? 'fill-red-500 text-red-500'
            : 'text-gray-400 group-hover:text-red-500 group-hover:scale-110'
        }`}
      />
      {showCount && (
        <span className={`font-semibold ${textSizeClasses[size]} ${
          optimisticHasVoted ? 'text-red-600' : 'text-gray-700'
        }`}>
          {optimisticVoteCount}
        </span>
      )}
    </button>
  );
}
