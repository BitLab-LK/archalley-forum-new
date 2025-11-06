"use client"

import { useState, useEffect } from "react"

export default function CompetitionPageClient() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    // Target date: November 11, 2025, 00:00 Sri Lankan time (GMT+5:30)
    // Using ISO string with timezone offset ensures accurate timezone handling
    const targetDate = new Date('2025-11-11T00:00:00+05:30').getTime()

    const updateCountdown = () => {
      const now = new Date().getTime()
      const difference = targetDate - now

      if (difference <= 0) {
        setIsExpired(true)
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    // Update immediately
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-900 via-blue-800 to-red-900">
      {/* Full width container - no sidebar */}
      <div className="w-full max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 text-white drop-shadow-lg">
            Archalley Competition 2025
          </h1>
          <div className="w-32 h-1 bg-red-500 mx-auto mb-6"></div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-blue-200 mb-4">
            Christmas in Future
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mt-4">
            Registrations will be opening on November 11, 2025
          </p>
        </div>

        {/* Countdown Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border-2 border-red-500/50 shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
              {isExpired ? (
                <span className="text-red-400">Registrations Are Now Open!</span>
              ) : (
                <span>Time Until Registration Opens</span>
              )}
            </h3>
            
            {!isExpired && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {/* Days */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-center border-2 border-blue-400 shadow-lg">
                  <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                  <div className="text-sm md:text-base lg:text-lg font-semibold text-blue-100 uppercase">
                    Days
                  </div>
                </div>

                {/* Hours */}
                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 text-center border-2 border-red-400 shadow-lg">
                  <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div className="text-sm md:text-base lg:text-lg font-semibold text-red-100 uppercase">
                    Hours
                  </div>
                </div>

                {/* Minutes */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-center border-2 border-blue-400 shadow-lg">
                  <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-sm md:text-base lg:text-lg font-semibold text-blue-100 uppercase">
                    Minutes
                  </div>
                </div>

                {/* Seconds */}
                <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 text-center border-2 border-red-400 shadow-lg">
                  <div className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-sm md:text-base lg:text-lg font-semibold text-red-100 uppercase">
                    Seconds
                  </div>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="text-center py-8">
                <div className="text-4xl md:text-6xl font-bold text-white mb-4">
                  🎄 Registrations Are Open! 🎄
                </div>
                <p className="text-xl md:text-2xl text-blue-100">
                  Don't miss out on this exciting opportunity!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Theme Description Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border-2 border-blue-500/50 shadow-2xl">
            <h3 className="text-3xl md:text-4xl font-bold text-center text-white mb-6">
              Theme: Christmas in Future
            </h3>
            <p className="text-lg md:text-xl text-blue-100 leading-relaxed text-center">
              Imagine Christmas celebrations reimagined through the lens of futuristic design, 
              sustainable innovation, and cutting-edge architecture. This year's competition 
              challenges participants to envision how we might celebrate Christmas in the years to come, 
              blending traditional holiday spirit with forward-thinking design principles.
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center items-center gap-8 mt-16 mb-8">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-50 animate-pulse"></div>
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 opacity-50 animate-pulse" style={{ animationDelay: '0.75s' }}></div>
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 opacity-50 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </div>
    </div>
  )
}

