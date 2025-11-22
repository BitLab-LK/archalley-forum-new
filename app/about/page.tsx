import type { Metadata } from "next"
import Image from "next/image"

export const metadata: Metadata = {
  title: "About Us - Archalley",
  description: "ARCHALLEY is your premier online destination for exploring and showcasing architecture and design, with a special focus on the Asian tropical regions.",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">About Archalley</h1>
        </div>

        {/* Content Section */}
        <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 space-y-6">
          <p className="text-lg leading-relaxed">
            ARCHALLEY is your premier online destination for exploring and showcasing architecture and design, with a special focus on the Asian tropical regions. Our platform connects architects, designers, and enthusiasts to celebrate and discuss innovative projects, blending technical excellence with aesthetic beauty. ARCHALLEY serves as a dynamic resource for learning and inspiration, offering a wealth of information on diverse architectural contexts, climates, and cultural influences. Join us to discover, discuss, and elevate the field of architecture.
          </p>
          
          <p className="text-lg leading-relaxed">
            At ARCHALLEY, our mission is to foster a vibrant community where architects, designers, and students can explore, share, and advance their knowledge of architecture and design. Our platform provides valuable insights into ongoing projects across various scales and styles, with a focus on the Asian tropical regions. We aim to support design professionals and enthusiasts in expanding their understanding and connections, while offering students a rich resource for academic projects and peer collaboration.
          </p>
        </div>

        {/* Image Section */}
        <div className="flex justify-center mt-8">
          <Image
            src="/uploads/about-archalley.webp"
            alt="About Archalley"
            width={800}
            height={600}
            className="rounded-lg shadow-lg"
          />
        </div>
      </div>
    </div>
  )
}

