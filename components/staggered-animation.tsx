"use client"

import { useEffect, useRef, useState } from 'react'

interface StaggeredAnimationProps {
  children: React.ReactNode[]
  className?: string
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export default function StaggeredAnimation({ 
  children, 
  className = '', 
  staggerDelay = 100,
  direction = 'up' 
}: StaggeredAnimationProps) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(children.length).fill(false))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reset all items first
          setVisibleItems(new Array(children.length).fill(false))
          
          // Then animate them in with stagger
          children.forEach((_, index) => {
            setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev]
                newState[index] = true
                return newState
              })
            }, index * staggerDelay)
          })
        } else {
          // Reset animation when element leaves viewport
          setVisibleItems(new Array(children.length).fill(false))
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
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
  }, [children.length, staggerDelay])

  const getTransform = (isVisible: boolean) => {
    if (isVisible) return 'translate(0)'
    
    switch (direction) {
      case 'up':
        return 'translateY(30px)'
      case 'down':
        return 'translateY(-30px)'
      case 'left':
        return 'translateX(30px)'
      case 'right':
        return 'translateX(-30px)'
      default:
        return 'translateY(30px)'
    }
  }

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: visibleItems[index] ? 1 : 0,
            transform: getTransform(visibleItems[index]),
            transition: 'all 0.6s ease-out',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}