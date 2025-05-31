import Header from "@/components/header"
import PostCreator from "@/components/post-creator"
import PostCard from "@/components/post-card"
import Sidebar from "@/components/sidebar"
import Footer from "@/components/footer"

// Mock data for posts
const mockPosts = [
  {
    id: "1",
    author: {
      name: "Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: true,
      rank: "Community Expert",
      rankIcon: "🏆",
    },
    content:
      "Just finished designing a sustainable office complex in downtown. The integration of green walls and natural lighting has been incredible. What are your thoughts on biophilic design in modern architecture?",
    category: "Design",
    isAnonymous: false,
    isPinned: true,
    upvotes: 45,
    downvotes: 2,
    comments: 12,
    timeAgo: "2 hours ago",
    images: ["/placeholder.svg?height=200&width=300"],
    topComment: {
      author: "Mike Johnson",
      content:
        "This is exactly what we need more of! The psychological benefits of biophilic design are well-documented.",
      isBestAnswer: true,
    },
  },
  {
    id: "2",
    author: {
      name: "Anonymous",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: false,
      rank: "",
      rankIcon: "",
    },
    content: "Need the service of a good architect for a proposed house in Mathugama",
    category: "Business",
    isAnonymous: true,
    isPinned: false,
    upvotes: 23,
    downvotes: 1,
    comments: 8,
    timeAgo: "4 hours ago",
    topComment: {
      author: "Emma Davis",
      content: "I can help you with that! I have experience with residential projects in that area.",
      isBestAnswer: false,
    },
  },
  {
    id: "3",
    author: {
      name: "Mike Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: true,
      rank: "Top Contributor",
      rankIcon: "⭐",
    },
    content: "Anyone know good suppliers for sustainable building materials?",
    category: "Construction",
    isAnonymous: false,
    isPinned: false,
    upvotes: 15,
    downvotes: 0,
    comments: 6,
    timeAgo: "5 hours ago",
  },
  {
    id: "4",
    author: {
      name: "Alex Rivera",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: true,
      rank: "Visual Storyteller",
      rankIcon: "📸",
    },
    content:
      "New construction technology is revolutionizing how we build. 3D printing concrete structures is no longer science fiction. Here's a project we completed last month using this technology. The precision and speed of construction were remarkable, and we were able to reduce material waste by 40%. The structural integrity tests have exceeded our expectations, and the cost savings were significant. This technology is definitely the future of construction, especially for complex geometric designs that would be difficult or expensive to achieve with traditional methods.",
    category: "Construction",
    isAnonymous: false,
    isPinned: false,
    upvotes: 67,
    downvotes: 3,
    comments: 15,
    timeAgo: "6 hours ago",
    images: ["/placeholder.svg?height=200&width=300", "/placeholder.svg?height=200&width=300"],
  },
  {
    id: "5",
    author: {
      name: "Emma Davis",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: false,
      rank: "Rising Star",
      rankIcon: "🌟",
    },
    content: "What's your favorite CAD software and why?",
    category: "Design",
    isAnonymous: false,
    isPinned: false,
    upvotes: 28,
    downvotes: 1,
    comments: 19,
    timeAgo: "8 hours ago",
  },
  {
    id: "6",
    author: {
      name: "David Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
      isVerified: true,
      rank: "Community Expert",
      rankIcon: "🏆",
    },
    content:
      "Looking for career advice on transitioning from civil engineering to architecture. Has anyone made this switch successfully?",
    category: "Career",
    isAnonymous: false,
    isPinned: false,
    upvotes: 34,
    downvotes: 0,
    comments: 11,
    timeAgo: "10 hours ago",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <PostCreator />

            <div className="space-y-4">
              {mockPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-8">
              <nav className="flex space-x-2">
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-2 text-sm font-medium text-white bg-primary border border-primary rounded-md">
                  1
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  2
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  3
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
