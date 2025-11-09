"use client"

import { useMemo } from "react"
import { Progress } from "@/components/ui/progress"

interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" }

    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    }

    // Calculate score
    if (checks.length) score += 1
    if (checks.lowercase) score += 1
    if (checks.uppercase) score += 1
    if (checks.number) score += 1
    if (checks.special) score += 1

    // Bonus for longer passwords
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1

    // Cap at 7
    score = Math.min(score, 7)

    let label = ""
    let color = ""

    if (score === 0) {
      label = ""
      color = ""
    } else if (score <= 2) {
      label = "Very Weak"
      color = "bg-red-500"
    } else if (score === 3) {
      label = "Weak"
      color = "bg-orange-500"
    } else if (score === 4) {
      label = "Fair"
      color = "bg-yellow-500"
    } else if (score === 5) {
      label = "Good"
      color = "bg-blue-500"
    } else if (score === 6) {
      label = "Strong"
      color = "bg-green-500"
    } else {
      label = "Very Strong"
      color = "bg-green-600"
    }

    return { score, label, color, checks: checks as any }
  }, [password])

  const percentage = (strength.score / 7) * 100

  if (!password) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password Strength</span>
        {strength.label && (
          <span className={`font-medium ${
            strength.score <= 2 ? 'text-red-500' :
            strength.score === 3 ? 'text-orange-500' :
            strength.score === 4 ? 'text-yellow-500' :
            strength.score === 5 ? 'text-blue-500' :
            'text-green-500'
          }`}>
            {strength.label}
          </span>
        )}
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
      />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={`flex items-center gap-1 ${
          strength.checks.length ? 'text-green-600' : 'text-gray-400'
        }`}>
          <span>{strength.checks.length ? '✓' : '○'}</span>
          <span>8+ characters</span>
        </div>
        <div className={`flex items-center gap-1 ${
          strength.checks.lowercase ? 'text-green-600' : 'text-gray-400'
        }`}>
          <span>{strength.checks.lowercase ? '✓' : '○'}</span>
          <span>Lowercase</span>
        </div>
        <div className={`flex items-center gap-1 ${
          strength.checks.uppercase ? 'text-green-600' : 'text-gray-400'
        }`}>
          <span>{strength.checks.uppercase ? '✓' : '○'}</span>
          <span>Uppercase</span>
        </div>
        <div className={`flex items-center gap-1 ${
          strength.checks.number ? 'text-green-600' : 'text-gray-400'
        }`}>
          <span>{strength.checks.number ? '✓' : '○'}</span>
          <span>Number</span>
        </div>
        <div className={`flex items-center gap-1 ${
          strength.checks.special ? 'text-green-600' : 'text-gray-400'
        }`}>
          <span>{strength.checks.special ? '✓' : '○'}</span>
          <span>Special char</span>
        </div>
      </div>
    </div>
  )
}
