"use client"

interface InfiniteScrollSentinelProps {
  sentinelRef: React.RefObject<HTMLDivElement>
  loading: boolean
  hasMore: boolean
}

export function InfiniteScrollSentinel({ 
  sentinelRef, 
  loading, 
  hasMore 
}: InfiniteScrollSentinelProps) {
  if (!hasMore) {
    return (
      <div className="flex justify-center items-center py-12 animate-slideInUp">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce-gentle">🎉</div>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            You've reached the end!
          </span>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Come back later for more posts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={sentinelRef} 
      className="flex justify-center items-center py-12"
    >
      {loading && (
        <div className="flex flex-col items-center space-y-4 animate-slideInUp">
          {/* Modern spinner */}
          <div className="relative">
            <div className="spinner-modern"></div>
            <div className="absolute inset-0 spinner-modern opacity-30 animate-pulse"></div>
          </div>
          
          {/* Loading text with typing effect */}
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
              Loading more posts
              <span className="animate-bounce inline-block ml-1">.</span>
              <span className="animate-bounce inline-block" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-bounce inline-block" style={{ animationDelay: '0.4s' }}>.</span>
            </span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Hang tight, we're fetching fresh content
            </p>
          </div>

          {/* Loading progress dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-gentle {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -4px, 0);
          }
          70% {
            transform: translate3d(0, -2px, 0);
          }
          90% {
            transform: translate3d(0, -1px, 0);
          }
        }

        .animate-slideInUp {
          animation: slideInUp 0.6s ease-out forwards;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s infinite;
        }

        .spinner-modern {
          border: 3px solid rgba(59, 130, 246, 0.1);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
