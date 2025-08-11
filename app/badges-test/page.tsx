"use client"

import { BadgeShowcase } from '@/components/badge-showcase'
import BadgeDisplay from '@/components/badge-display'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'

export default function BadgesTestPage() {
  const { user } = useAuth()
  const [testUserId, setTestUserId] = useState('')

  // Sample badge data for testing BadgeDisplay component
  const sampleBadges = [
    {
      id: '1',
      name: 'First Post',
      description: 'Created your first post',
      icon: '🎉',
      color: '#10B981',
      level: 'BRONZE',
    },
    {
      id: '2', 
      name: 'Well Liked',
      description: 'Received 100+ upvotes',
      icon: '❤️',
      color: '#EC4899',
      level: 'SILVER',
    },
    {
      id: '3',
      name: 'Community Favorite',
      description: 'Received 1000+ upvotes',
      icon: '🏆',
      color: '#8B5CF6',
      level: 'PLATINUM',
    }
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Badge System Test Page</h1>
        <p className="text-muted-foreground mb-6">
          Testing the new badge system functionality
        </p>
      </div>

      {/* Badge Display Component Test */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Display Component</CardTitle>
          <CardDescription>
            Testing the BadgeDisplay component with sample badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BadgeDisplay badges={sampleBadges} />
        </CardContent>
      </Card>

      {/* Current User's Badges */}
      {user && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Badges</h2>
          <BadgeShowcase userId={user.id} showAvailableBadges />
        </div>
      )}

      {/* Test with different user */}
      <Card>
        <CardHeader>
          <CardTitle>Test Other User's Badges</CardTitle>
          <CardDescription>
            Enter a user ID to view their badges (test users: user-1, user-2, user-3, admin-1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder="Enter user ID (e.g., user-1)"
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button onClick={() => setTestUserId('user-1')}>
              Load user-1
            </Button>
            <Button onClick={() => setTestUserId('admin-1')}>
              Load admin-1
            </Button>
          </div>
          {testUserId && (
            <BadgeShowcase userId={testUserId} showAvailableBadges />
          )}
        </CardContent>
      </Card>

      {/* API Test Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>API Tests</CardTitle>
          <CardDescription>
            Test badge system APIs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={async () => {
                const response = await fetch('/api/badges')
                const data = await response.json()
                console.log('All badges:', data)
                alert(`Loaded ${data.length} badges. Check console for details.`)
              }}
            >
              Get All Badges
            </Button>
            
            <Button
              onClick={async () => {
                const response = await fetch('/api/badges/leaderboard')
                const data = await response.json()
                console.log('Badge leaderboard:', data)
                alert('Badge leaderboard loaded. Check console.')
              }}
            >
              Get Leaderboard
            </Button>

            {user && (
              <>
                <Button
                  onClick={async () => {
                    const response = await fetch(`/api/badges/user/${user.id}`)
                    const data = await response.json()
                    console.log('User badges:', data)
                    alert(`User has ${data.length} badges. Check console.`)
                  }}
                >
                  Get My Badges
                </Button>

                <Button
                  onClick={async () => {
                    const response = await fetch(`/api/badges/user/${user.id}/check`, {
                      method: 'POST'
                    })
                    const data = await response.json()
                    console.log('Badge check result:', data)
                    alert(data.message || 'Badge check completed')
                  }}
                >
                  Check for New Badges
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
