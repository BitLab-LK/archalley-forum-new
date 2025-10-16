"use client"

import { useEffect, useRef, useState } from 'react'

interface EnhancedScrollAnimationProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  duration?: number
  triggerOnce?: boolean
  threshold?: number
}

export default function EnhancedScrollAnimation({ 
  children, 
  className = '', 
  delay = 0, 
  direction = 'up',
  duration = 600,
  triggerOnce = false,
  threshold = 0.1
}: EnhancedScrollAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!triggerOnce || !hasTriggered) {
            setTimeout(() => {
              setIsVisible(true)
              setHasTriggered(true)
            }, delay)
          }
        } else {
          // Only reset if not triggerOnce or if we want repeatable animations
          if (!triggerOnce) {
            setIsVisible(false)
          }
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [delay, triggerOnce, hasTriggered, threshold])

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return 'translateY(40px)'
      case 'down':
        return 'translateY(-40px)'
      case 'left':
        return 'translateX(40px)'
      case 'right':
        return 'translateX(-40px)'
      default:
        return 'none'
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0)' : getTransform(),
        transition: `all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      }}
    >
      {children}
    </div>
  )
}