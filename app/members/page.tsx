
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Calendar, CheckCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Member {
  id: string
  name: string
  profession: string | null
  company: string | null
  location: string | null
  rank: string
  posts: number
  upvotes: number
  joinDate: string
  isVerified: boolean
  avatar: string | null
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [professionFilter, setProfessionFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  const handleViewProfile = (memberId: string) => {
    router.push(`/profile/${memberId}`)
  }

  // Fetch members from API
  useEffect(() => {
    async function fetchMembers() {
      try {
        setIsLoading(true)
        
        // Try the API endpoint
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? `${window.location.origin}/api/users`
          : '/api/users'
        
        console.log('🔍 Fetching members from:', apiUrl)
        const response = await fetch(apiUrl)
        
        console.log('📡 Response status:', response.status)
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Failed to fetch members:', response.status, errorText)
          throw new Error(`Failed to fetch members: ${response.status} - ${errorText.substring(0, 100)}`)
        }
        
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text()
          console.error('❌ Expected JSON but got:', contentType, responseText.substring(0, 200))
          throw new Error('Server returned invalid response format. Expected JSON but got: ' + contentType)
        }
        
        const data = await response.json()
        console.log('✅ Successfully fetched members:', data.users?.length || 0)
        setMembers(data.users || [])
      } catch (err) {
        console.error('❌ Error fetching members:', err)
        setError(err instanceof Error ? err.message : 'Failed to load members')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMembers()
  }, [])

  // Filter and sort members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.company && member.company.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesProfession = professionFilter === "all" || 
                             (member.profession && member.profession.toLowerCase().replace(' ', '-') === professionFilter)
    
    return matchesSearch && matchesProfession
  })

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "posts":
        return b.posts - a.posts
      case "upvotes":
        return b.upvotes - a.upvotes
      case "recent":
      default:
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
    }
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Members</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with architects, designers, and construction professionals
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search members by name or company..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={professionFilter} onValueChange={setProfessionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by profession" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Professions</SelectItem>
                  <SelectItem value="architect">Architect</SelectItem>
                  <SelectItem value="interior-designer">Interior Designer</SelectItem>
                  <SelectItem value="construction-manager">Construction Manager</SelectItem>
                  <SelectItem value="urban-planner">Urban Planner</SelectItem>
                  <SelectItem value="civil-engineer">Civil Engineer</SelectItem>
                  <SelectItem value="landscape-architect">Landscape Architect</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="posts">Most Posts</SelectItem>
                  <SelectItem value="upvotes">Most Upvotes</SelectItem>
                  <SelectItem value="recent">Recently Joined</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading members...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center text-red-600 dark:text-red-400">
                <h3 className="text-lg font-semibold mb-2">Unable to Load Members</h3>
                <p className="mb-4">{error}</p>
                <div className="flex justify-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        setError(null)
                        setIsLoading(true)
                        const healthResponse = await fetch('/api/health')
                        const healthData = await healthResponse.json()
                        console.log('Health check:', healthData)
                        if (healthData.status === 'ok') {
                          window.location.reload()
                        } else {
                          setError('API is not responding correctly')
                        }
                      } catch (err) {
                        setError('Unable to connect to server')
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                  >
                    Test Connection
                  </Button>
                </div>
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                  <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {JSON.stringify({
                      url: window.location.href,
                      userAgent: navigator.userAgent,
                      timestamp: new Date().toISOString()
                    }, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members Grid */}
        {!isLoading && !error && (
          <>
            {sortedMembers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm || professionFilter !== "all" 
                      ? "No members found matching your criteria." 
                      : "No members found."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={member.avatar || "/placeholder-user.jpg"} />
                          <AvatarFallback>
                            {member.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                            {member.isVerified && <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {member.profession || 'Professional'}
                          </p>
                          <p className="text-gray-500 text-sm mb-3">
                            {member.company || 'Independent'}
                          </p>

                          {member.location && (
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="truncate">{member.location}</span>
                            </div>
                          )}

                          <Badge variant="secondary" className="mb-3">
                            {member.rank}
                          </Badge>

                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <span>{member.posts} posts</span>
                            <span>{member.upvotes} upvotes</span>
                          </div>

                          <div className="flex items-center text-xs text-gray-500 mb-4">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>Joined {member.joinDate}</span>
                          </div>

                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleViewProfile(member.id)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {sortedMembers.length > 0 && (
              <div className="flex justify-center mt-8">
                <nav className="flex space-x-2">
                  <Button variant="outline" disabled>
                    Previous
                  </Button>
                  <Button variant="default">1</Button>
                  <Button variant="outline">2</Button>
                  <Button variant="outline">3</Button>
                  <Button variant="outline">Next</Button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
