/**
 * Registration Countdown Component
 * Shows a countdown timer until registration opens
 */

'use client';

import { useState, useEffect } from 'react';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

interface Props {
  targetDate: Date | string;
  onExpired?: () => void;
}

export default function RegistrationCountdown({ targetDate, onExpired }: Props) {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = (): CountdownTime => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false,
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.isExpired && onExpired) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onExpired]);

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500 rounded-lg p-8 text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
        Registration Opens Soon
      </h2>
      <p className="text-gray-700 text-lg mb-8">
        Registration will open on{' '}
        {new Date(targetDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      <div className="flex justify-center items-center gap-4 md:gap-6">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="bg-orange-500 text-white rounded-lg px-4 md:px-6 py-3 md:py-4 min-w-[70px] md:min-w-[90px]">
            <div className="text-2xl md:text-4xl font-bold">{String(timeLeft.days).padStart(2, '0')}</div>
          </div>
          <div className="text-sm md:text-base text-gray-600 mt-2 font-medium">Days</div>
        </div>

        {/* Separator */}
        <div className="text-2xl md:text-4xl font-bold text-orange-500">:</div>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="bg-orange-500 text-white rounded-lg px-4 md:px-6 py-3 md:py-4 min-w-[70px] md:min-w-[90px]">
            <div className="text-2xl md:text-4xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
          </div>
          <div className="text-sm md:text-base text-gray-600 mt-2 font-medium">Hours</div>
        </div>

        {/* Separator */}
        <div className="text-2xl md:text-4xl font-bold text-orange-500">:</div>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="bg-orange-500 text-white rounded-lg px-4 md:px-6 py-3 md:py-4 min-w-[70px] md:min-w-[90px]">
            <div className="text-2xl md:text-4xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
          </div>
          <div className="text-sm md:text-base text-gray-600 mt-2 font-medium">Minutes</div>
        </div>

        {/* Separator */}
        <div className="text-2xl md:text-4xl font-bold text-orange-500">:</div>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="bg-orange-500 text-white rounded-lg px-4 md:px-6 py-3 md:py-4 min-w-[70px] md:min-w-[90px]">
            <div className="text-2xl md:text-4xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
          </div>
          <div className="text-sm md:text-base text-gray-600 mt-2 font-medium">Seconds</div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-8">
        Get ready to register for this exciting competition!
      </p>
    </div>
  );
}

