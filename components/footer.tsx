import Link from "next/link"
import Image from "next/image"
import { SOCIAL_MEDIA } from "@/lib/constants"

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      {/* Social Media Links */}
      <div className="container mx-auto px-4 py-8 border-b border-gray-800">
        <div className="flex flex-wrap justify-center gap-10">
          <Link href={SOCIAL_MEDIA.facebook} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
            <span className="rounded-full bg-[#282828] group-hover:bg-[#FFA000] w-9 h-9 flex items-center justify-center transition-colors">
              <i className="lni lni-facebook text-white text-base"></i>
            </span>
            <span>Facebook</span>
          </Link>
          <Link href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
            <span className="rounded-full bg-[#282828] group-hover:bg-[#FFA000] w-9 h-9 flex items-center justify-center transition-colors">
              <i className="lni lni-instagram text-white text-base"></i>
            </span>
            <span>Instagram</span>
          </Link>
          <Link href={SOCIAL_MEDIA.youtube.channelUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
            <span className="rounded-full bg-[#282828] group-hover:bg-[#FFA000] w-9 h-9 flex items-center justify-center transition-colors">
              <i className="lni lni-youtube text-white text-base"></i>
            </span>
            <span>Youtube</span>
          </Link>
          <Link href={SOCIAL_MEDIA.tiktok} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
            <span className="rounded-full bg-[#282828] group-hover:bg-[#FFA000] w-9 h-9 flex items-center justify-center transition-colors">
              <i className="lni lni-tiktok text-white text-base"></i>
            </span>
            <span>TikTok</span>
          </Link>
          <Link href={SOCIAL_MEDIA.pinterest} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
            <span className="rounded-full bg-[#282828] group-hover:bg-[#FFA000] w-9 h-9 flex items-center justify-center transition-colors">
              <i className="lni lni-pinterest text-white text-base"></i>
            </span>
            <span>Pinterest</span>
          </Link>
          <Link href={SOCIAL_MEDIA.linkedin} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
            <span className="rounded-full bg-[#282828] group-hover:bg-[#FFA000] w-9 h-9 flex items-center justify-center transition-colors">
              <i className="lni lni-linkedin text-white text-base"></i>
            </span>
            <span>LinkedIn</span>
          </Link>
          <Link href={SOCIAL_MEDIA.twitter} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
            <span className="rounded-full bg-[#282828] group-hover:bg-[#FFA000] w-9 h-9 flex items-center justify-center transition-colors">
              <i className="lni lni-x text-white text-base"></i>
            </span>
            <span>Twitter / X</span>
          </Link>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="https://archalley.com/wp-content/uploads/2024/07/archalley-logo-whte-x85.png"
                alt="Archalley Logo"
                width={85}
                height={30}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-gray-400 mb-6 max-w-xl">
              Archalley is a leading platform for architecture, design, and urban planning content. We showcase
              innovative projects, share industry news, and provide insights into the latest trends and developments in
              the built environment.
            </p>

            <div className="flex flex-wrap gap-4 mb-6">
              <Link href="/" className="text-sm hover:text-[#FFA000] transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm hover:text-[#FFA000] transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm hover:text-[#FFA000] transition-colors">
                Contact
              </Link>
              <Link href="/privacy-policy" className="text-sm hover:text-[#FFA000] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-conditions" className="text-sm hover:text-[#FFA000] transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/refund-policy" className="text-sm hover:text-[#FFA000] transition-colors">
                Refund Policy
              </Link>
            </div>
          </div>

          {/* Right Column - Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4">Categories</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* First Column */}
              <div>
                <ul className="space-y-2">
                  <li>
                    <Link href="/projects/commercial" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Commercial & Offices
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects/hospitality" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Hospitality Architecture
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects/industrial" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Industrial & Infrastructure
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Second Column */}
              <div>
                <ul className="space-y-2">
                  <li>
                    <Link href="/projects/interior" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Interior Design
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects/landscape" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Landscape & Urbanism
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects/public" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Public Architecture
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Third Column */}
              <div>
                <ul className="space-y-2">
                  <li>
                    <Link href="/projects/refurbishment" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Refurbishment
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects/religious" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Religious Architecture
                    </Link>
                  </li>
                  <li>
                    <Link href="/projects/residential" className="text-sm text-gray-400 hover:text-[#FFA000] transition-colors">
                      Residential Architecture
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/projects/submit"
                className="inline-block bg-[#FFA000] hover:bg-[#e08f00] text-white px-6 py-3 rounded-md font-medium transition-colors"
              >
                Submit Your Project
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="bg-gray-900 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © 2025 Archalley™ | All Rights Reserved | Designed & Developed by BitLab (Pvt) Ltd ✨
        </div>
      </div>
    </footer>
  )
}
