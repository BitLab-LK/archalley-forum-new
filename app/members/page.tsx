
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Calendar, CheckCircle } from "lucide-react"

const members = [
  {
    id: 1,
    name: "Sarah Chen",
    profession: "Architect",
    company: "Chen Design Studio",
    location: "San Francisco, CA",
    rank: "Community Expert",
    posts: 156,
    upvotes: 1234,
    joinDate: "Jan 2023",
    isVerified: true,
    avatar: "/placeholder.svg?height=64&width=64",
  },
  {
    id: 2,
    name: "Mike Johnson",
    profession: "Interior Designer",
    company: "Johnson Interiors",
    location: "New York, NY",
    rank: "Top Contributor",
    posts: 134,
    upvotes: 987,
    joinDate: "Feb 2023",
    isVerified: true,
    avatar: "/placeholder.svg?height=64&width=64",
  },
  {
    id: 3,
    name: "Alex Rivera",
    profession: "Construction Manager",
    company: "Rivera Construction",
    location: "Los Angeles, CA",
    rank: "Visual Storyteller",
    posts: 98,
    upvotes: 756,
    joinDate: "Mar 2023",
    isVerified: false,
    avatar: "/placeholder.svg?height=64&width=64",
  },
  {
    id: 4,
    name: "Emma Davis",
    profession: "Urban Planner",
    company: "City Planning Associates",
    location: "Chicago, IL",
    rank: "Valued Responder",
    posts: 87,
    upvotes: 654,
    joinDate: "Apr 2023",
    isVerified: true,
    avatar: "/placeholder.svg?height=64&width=64",
  },
  {
    id: 5,
    name: "David Wilson",
    profession: "Civil Engineer",
    company: "Wilson Engineering",
    location: "Seattle, WA",
    rank: "Rising Star",
    posts: 65,
    upvotes: 432,
    joinDate: "May 2023",
    isVerified: false,
    avatar: "/placeholder.svg?height=64&width=64",
  },
  {
    id: 6,
    name: "Lisa Thompson",
    profession: "Landscape Architect",
    company: "Green Spaces Design",
    location: "Portland, OR",
    rank: "Conversation Starter",
    posts: 43,
    upvotes: 321,
    joinDate: "Jun 2023",
    isVerified: false,
    avatar: "/placeholder.svg?height=64&width=64",
  },
]

export default function MembersPage() {
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
                <Input placeholder="Search members by name or company..." className="pl-10" />
              </div>
              <Select>
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
              <Select>
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

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{member.name}</h3>
                      {member.isVerified && <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{member.profession}</p>
                    <p className="text-gray-500 text-sm mb-3">{member.company}</p>

                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="truncate">{member.location}</span>
                    </div>

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

                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
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
      </main>

      
    </div>
  )
}
