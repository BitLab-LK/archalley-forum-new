import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Clock, ExternalLink } from "lucide-react"

const events = [
  {
    title: "International Architecture Summit 2025",
    description: "Join leading architects and designers from around the world for three days of workshops, presentations, and networking.",
    date: "November 15-17, 2025",
    time: "9:00 AM - 6:00 PM",
    location: "Convention Center, Singapore",
    type: "Conference",
    attendees: "2,500+",
    featured: true,
    status: "upcoming"
  },
  {
    title: "Sustainable Design Workshop",
    description: "Hands-on workshop focusing on eco-friendly design principles and green building techniques.",
    date: "October 28, 2025",
    time: "2:00 PM - 5:00 PM",
    location: "Design Studio, London",
    type: "Workshop",
    attendees: "50",
    featured: true,
    status: "upcoming"
  },
  {
    title: "Digital Architecture Expo",
    description: "Explore the latest in digital design tools, VR architecture, and AI-assisted design.",
    date: "December 5-7, 2025",
    time: "10:00 AM - 8:00 PM",
    location: "Tech Hub, San Francisco",
    type: "Exhibition",
    attendees: "1,200+",
    featured: false,
    status: "upcoming"
  },
  {
    title: "Heritage Preservation Symposium",
    description: "Discuss best practices for preserving and adapting historical buildings for modern use.",
    date: "January 20, 2026",
    time: "9:00 AM - 4:00 PM",
    location: "University Campus, Rome",
    type: "Symposium",
    attendees: "300",
    featured: false,
    status: "upcoming"
  },
  {
    title: "Young Architects Meetup",
    description: "Networking event for emerging architects and recent graduates to connect and share experiences.",
    date: "October 30, 2025",
    time: "6:00 PM - 9:00 PM",
    location: "Innovation Center, Berlin",
    type: "Networking",
    attendees: "150",
    featured: false,
    status: "upcoming"
  },
  {
    title: "Climate Resilient Design Conference",
    description: "Learn about designing buildings that can withstand extreme weather and climate change impacts.",
    date: "September 15, 2025",
    time: "9:00 AM - 5:00 PM",
    location: "Research Institute, Amsterdam",
    type: "Conference",
    attendees: "800",
    featured: false,
    status: "past"
  }
]

const eventTypes = ["All", "Conference", "Workshop", "Exhibition", "Symposium", "Networking"]
const statusFilters = ["All", "Upcoming", "Past"]

export default function EventsPage() {
  const upcomingEvents = events.filter(event => event.status === "upcoming")
  const pastEvents = events.filter(event => event.status === "past")

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold tracking-tight">
              Architecture Events
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover conferences, workshops, exhibitions, and networking events in the 
            architecture and design community. Connect, learn, and grow with fellow professionals.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-12">
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Event Type</h3>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((type) => (
                <Button 
                  key={type} 
                  variant={type === "All" ? "default" : "outline"} 
                  size="sm"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((status) => (
                <Button 
                  key={status} 
                  variant={status === "All" ? "default" : "outline"} 
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Events */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Events</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {events.filter(event => event.featured).map((event, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{event.type}</Badge>
                    <Badge variant={event.status === "upcoming" ? "default" : "outline"}>
                      {event.status === "upcoming" ? "Upcoming" : "Past"}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {event.attendees} attendees
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        {event.status === "upcoming" ? "Register" : "View Details"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.filter(event => !event.featured).map((event, index) => (
              <Card key={index} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{event.type}</Badge>
                    <Badge variant="default">Upcoming</Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {event.title}
                  </CardTitle>
                  <CardDescription>
                    {event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        {event.attendees} attendees
                      </div>
                    </div>
                    <Button size="sm" className="w-full">
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Past Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event, index) => (
                <Card key={index} className="group hover:shadow-lg transition-shadow opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{event.type}</Badge>
                      <Badge variant="outline">Past</Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {event.title}
                    </CardTitle>
                    <CardDescription>
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {event.date}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        View Summary
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Host Event CTA */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Host Your Event</CardTitle>
              <CardDescription className="text-lg">
                Planning an architecture event? List it on our platform and reach thousands of professionals in the community.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="/forum">
                    Create Event
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/register">
                    Join Community
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}