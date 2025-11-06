"use client"

import Image from "next/image"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function TreeWithoutATreePage() {
  return (
    <div className="min-h-screen bg-[#000] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Section 1: Competition Title */}
        <section className="py-16 px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-[#FFA500] mb-4">
            Tree without a Tree
          </h1>
          <p className="text-xl md:text-2xl text-white mb-2">
            Archalley Competitions 2024
          </p>
          <p className="text-lg md:text-xl text-white mb-8">
            Innovative Christmas Tree "Design, Make & Decorate" Competition
          </p>
          
          {/* Official Partners Section */}
          <div className="mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] mb-6">
              Official Partners
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
              {/* Access Lifestyle Logo */}
              <div className="relative w-[200px] h-[120px]">
                <Image
                  src="/uploads/Access-Logo.jpg"
                  alt="Access LIFESTYLE Logo"
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>
              
              {/* A Brand Logo */}
              <div className="relative w-[200px] h-[120px]">
                <Image
                  src="/uploads/ABrand-Logo.jpg"
                  alt="A BRAND Logo"
                  fill
                  className="object-contain"
                  sizes="200px"
                />
              </div>
            </div>
          </div>
          
          <div className="w-32 h-0.5 bg-white mx-auto"></div>
        </section>

        {/* Section 2: Competition Overview */}
        <section className="py-16 px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase mb-8">
            COMPETITION OVERVIEW
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-[#FFA500] mb-8">
            Tree without a Tree
          </h3>
          <div className="mx-auto space-y-6 max-w-4xl">
            <p className="text-lg md:text-xl text-white">
              was a competition designed to explore alternative solutions for traditional methods of building Christmas trees, beyond the conventional approach.
            </p>
            <p className="text-lg md:text-xl text-white">
              During the Christmas season, we embraced
            </p>
            <p className="text-3xl md:text-4xl font-bold text-[#FFA500]">
              The spirit of giving
            </p>
            <p className="text-lg md:text-xl text-white">
              by expressing our love and concern for the environment, with an attempt to
            </p>
            <p className="text-3xl md:text-4xl font-bold text-[#FFA500]">
              protect natural trees & reduce waste after use,
            </p>
            <p className="text-lg md:text-xl text-white">
              ensuring a joyful and eco-friendly celebration.
            </p>
          </div>
        </section>

        {/* Section 3: Awards */}
        <section className="py-16 px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase mb-8">
            AWARDS
          </h2>
          <p className="text-xl text-white mb-4">Total prize fund</p>
          <p className="text-6xl md:text-8xl font-bold text-[#FFA500] mb-8">
            LKR 325,000.00
          </p>
          <p className="text-lg md:text-xl text-white mb-12 mx-auto max-w-4xl">
            3 winning proposals, a special award recipient and 3 honorable mentions were selected. Archalley awarded a total of LKR 325,000.00 in prize money to competition winners as follows:
          </p>
          
          {/* Prize Grid - Column 1: 3 cells, Column 2 & 3: 2 cells each with matching heights */}
          <div className="mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl">
            {/* Column 1 - 3 cells */}
            <div className="flex flex-col gap-4">
              {/* 1st Prize */}
              <div className="bg-black border border-gray-400 p-6 flex flex-col justify-center items-center text-center min-h-[120px]">
                <p className="text-white text-lg mb-2">1st Prize</p>
                <p className="text-[#FFA500] text-4xl font-bold">LKR 150,000.00</p>
              </div>
              
              {/* 2nd Prize */}
              <div className="bg-black border border-gray-400 p-6 flex flex-col justify-center items-center text-center min-h-[120px]">
                <p className="text-white text-lg mb-2">2nd Prize</p>
                <p className="text-[#FFA500] text-4xl font-bold">LKR 50,000.00</p>
              </div>
              
              {/* 3rd Prize */}
              <div className="bg-black border border-gray-400 p-6 flex flex-col justify-center items-center text-center min-h-[120px]">
                <p className="text-white text-lg mb-2">3rd Prize</p>
                <p className="text-[#FFA500] text-4xl font-bold">LKR 25,000.00</p>
              </div>
            </div>
            
            {/* Column 2 - 2 cells that match Column 1 total height */}
            <div className="flex flex-col gap-4 h-full">
              {/* Archalley Most Popular Tree Award */}
              <div className="bg-black border border-gray-400 p-6 flex flex-col justify-center items-center text-center flex-1">
                <p className="text-white text-lg mb-2">Archalley Most Popular Tree Award</p>
                <p className="text-[#FFA500] text-4xl font-bold">LKR 100,000.00</p>
              </div>
              
              {/* Special Giveaways */}
              <div className="bg-black border border-gray-400 p-6 flex flex-col justify-center items-center text-center flex-1">
                <p className="text-white text-lg mb-2">Special giveaways were awarded for</p>
                <p className="text-[#FFA500] text-3xl font-bold">Sustainable Designs</p>
              </div>
            </div>
            
            {/* Column 3 - 2 cells that match Column 1 total height */}
            <div className="flex flex-col gap-4 h-full">
              {/* 3 Honorable mentions */}
              <div className="bg-black border border-gray-400 p-6 flex flex-col justify-center items-center text-center flex-1">
                <p className="text-white text-lg mb-2">3 Honorable mentions</p>
                <p className="text-[#FFA500] text-3xl font-bold">Certificate of</p>
                <p className="text-[#FFA500] text-3xl font-bold">achievement</p>
              </div>
              
              {/* 10 Finalists */}
              <div className="bg-black border border-gray-400 p-6 flex flex-col justify-center items-center text-center flex-1">
                <p className="text-white text-lg mb-2">10 Finalists</p>
                <p className="text-[#FFA500] text-3xl font-bold">were announced</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Contribution */}
        <section className="py-16 px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase text-center mb-12">
            CONTRIBUTION
          </h2>
          
          {/* Row 1 */}
          <div className="mx-auto mb-16 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="text-lg text-white space-y-4">
                <p>
                  We are proud to announce that we have handed over the contribution to SOS Children's Villages as part of the Tree Without a Tree competition. 💚 A heartfelt thank you to all participants and supporters for helping us make a meaningful impact this Christmas. Together, we are fostering creativity, sustainability, and compassion. ✨ Let's continue to inspire positive change—one step at a time.
                </p>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src="/uploads/sos-donation-2024.jpeg"
                  alt="SOS Children's Villages Donation Event"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
          
          {/* Row 2 */}
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src="/uploads/Plant-Sapling-2024.jpeg"
                  alt="Plant Sapling Donation at Diyasaru Park"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <div className="text-lg text-white space-y-4">
                <p>
                  Giving Back to Nature at Diyasaru Park, Thalawathugoda! As part of the Tree Without a Tree competition, we proudly donated trees and fertilizers to support the green initiatives at Diyasaru Park. ✨🌱 This effort is a step toward fostering a sustainable future while honoring our commitment to the environment. A heartfelt thank you to all participants and supporters who made this possible. 💚 Let's continue to grow and give back to nature together!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Jury */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
            <h2 className="text-4xl md:text-5xl font-bold text-white uppercase text-center mb-8">
              JURY
            </h2>
            <p className="text-lg text-white text-center mb-12">
              We sincerely thank our jury panel for their time and expertise.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Jury Member 1 */}
              <div className="text-center">
                <div className="relative w-48 h-48 rounded-full mx-auto mb-4 overflow-hidden">
                  <Image
                    src="/uploads/otara.webp"
                    alt="Otara Gunewardene"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Otara Gunewardene</h3>
                <p className="text-sm text-white">DIRECTOR, EMBARK & OTARA FOUNDATION</p>
              </div>
              
              {/* Jury Member 2 */}
              <div className="text-center">
                <div className="relative w-48 h-48 rounded-full mx-auto mb-4 overflow-hidden">
                  <Image
                    src="/uploads/philip.webp"
                    alt="Philip Weeraratne"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Philip Weeraratne</h3>
                <p className="text-sm text-white">FOUNDER & PRINCIPAL ARCHITECT, PWA ARCHITECTS</p>
              </div>
              
              {/* Jury Member 3 */}
              <div className="text-center">
                <div className="relative w-48 h-48 rounded-full mx-auto mb-4 overflow-hidden">
                  <Image
                    src="/uploads/ajai.webp"
                    alt="Ajai Vir Singh"
                    fill
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ajai Vir Singh</h3>
                <p className="text-sm text-white">FOUNDER, CFW, CEYLON LITERARY FESTIVAL, COLLEGE OF FASHION & DESIGN</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Winners */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
            <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-16">
              WINNERS
            </h2>
            
            {/* Winners Grid - 3 columns on desktop */}
            <WinnerCarousel />
          </div>
        </section>

        {/* Section 7: Most Popular Award */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
            <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-8">
              MOST POPULAR AWARD
            </h2>
            <p className="text-lg text-white text-center mb-12 max-w-4xl mx-auto">
              Congratulations to Rashane Fernando for winning the vote race and earning the title of Most Popular in the 'Tree Without a Tree' competition 2024!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src="/uploads/Most-Popular-Award_1.webp"
                  alt="Most Popular Award - Presentation Slide 1"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src="/uploads/Most-Popular-Award_2.webp"
                  alt="Most Popular Award - Presentation Slide 2"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src="/uploads/Most-Popular-Award_3.webp"
                  alt="Most Popular Award - Most Popular Tree with Badge"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Special Sustainable Award */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
            <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-4">
              SPECIAL SUSTAINABLE AWARD
            </h2>
            <h3 className="text-2xl font-bold text-white uppercase text-center mb-8">
              FROM ACCESS LIFESTYLE
            </h3>
            <p className="text-lg text-white text-center mb-12 max-w-4xl mx-auto">
              Congratulations to Ameeda Gunathilaka! Her effort and eco-friendly design is highly appreciated by Access Lifestyle, earning special recognition for their Sustainable Giveaway.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <SustainableAwardCarousel />
              <div className="text-white space-y-4 text-left">
                <p className="text-lg">
                  This sustainable Christmas tree was crafted using entirely natural and biodegradable materials, showcasing innovative eco-friendly design principles.
                </p>
                <div>
                  <h4 className="text-xl font-bold text-[#FFA500] mb-4">Materials Used:</h4>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Dried seed pods from various native trees</li>
                    <li>Fallen leaves collected from local parks</li>
                    <li>Natural twine made from coconut fiber</li>
                    <li>Biodegradable wooden base</li>
                    <li>LED lights powered by solar energy</li>
                  </ol>
                </div>
                <p className="text-lg">
                  The construction process involved careful selection of materials that would naturally decompose, creating a tree that celebrates the holiday spirit while respecting the environment.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 9: Honourable Mentions */}
        <section className="py-16 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
            <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-16">
              HONOURABLE MENTIONS
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Honourable Mention 1 */}
              <div className="border border-white p-6">
                <div className="relative aspect-square rounded-lg mb-4 overflow-hidden">
                  <Image
                    src="/uploads/Honourable-Mentions-Rashane_1.webp"
                    alt="Rashane Fernando - Honourable Mention"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <p className="text-white">
                  A big shoutout to Rashane Fernando for his remarkable entry! His unique vision and creative effort deserve special recognition in the 'Tree Without a Tree' competition 2024.
                </p>
              </div>
              
              {/* Honourable Mention 2 */}
              <div className="border border-white p-6">
                <div className="relative aspect-square rounded-lg mb-4 overflow-hidden">
                  <Image
                    src="/uploads/Honourable-Mentions-BIMA_1.webp"
                    alt="BIMA Lanka Insurance Brokers - Honourable Mention"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <p className="text-white">
                  A big shoutout to BIMA Lanka Insurance Brokers (Pvt) Ltd for their remarkable entry! Their unique vision and creative effort deserve special recognition in the 'Tree Without a Tree' competition 2024.
                </p>
              </div>
              
              {/* Honourable Mention 3 */}
              <div className="border border-white p-6">
                <div className="relative aspect-square rounded-lg mb-4 overflow-hidden">
                  <Image
                    src="/uploads/Honourable-Mentions-Abigail_1.webp"
                    alt="Abigail Fernando - Honourable Mention"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <p className="text-white">
                  A big shoutout to Abigail Fernando for her remarkable entry! Her unique vision and creative effort deserve special recognition in the 'Tree Without a Tree' competition 2024.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Carousel component for individual winner images
function WinnerCarouselItem({ images, title, description }: { images: string[], title: string, description: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="flex flex-col">
      <h3 className="text-2xl font-bold text-white mb-4 text-center">{title}</h3>
      <div className="relative aspect-square rounded-lg overflow-hidden mb-4 group">
        <Image
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
        {/* Navigation Arrows */}
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <p className="text-lg text-white text-center">{description}</p>
    </div>
  )
}

function WinnerCarousel() {
  const winners = [
    {
      title: "1st Place Winner",
      images: ["/uploads/Winner-1_1.webp", "/uploads/Winner-1_2.webp", "/uploads/Winner-1_3.webp"],
      description: "Methodist Church Youth – Seeduwa"
    },
    {
      title: "2nd Place Winner",
      images: ["/uploads/Winner-2_1.webp", "/uploads/Winner-2_2.webp", "/uploads/Winner-2_3.webp"],
      description: "Pasindu Kithmina"
    },
    {
      title: "3rd Place Winner",
      images: ["/uploads/Winner-3_1.webp", "/uploads/Winner-3_2.webp", "/uploads/Winner-3_3.webp"],
      description: "KWCA – Kosala Weerasekara Chartered Architects"
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {winners.map((winner, index) => (
        <WinnerCarouselItem
          key={index}
          images={winner.images}
          title={winner.title}
          description={winner.description}
        />
      ))}
    </div>
  )
}

// Carousel component for Special Sustainable Award images
function SustainableAwardCarousel() {
  const images = ["/uploads/Special-Sustainable-Award_1.webp", "/uploads/Special-Sustainable-Award_2.webp"]
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative aspect-square rounded-lg overflow-hidden group max-w-md mx-auto lg:max-w-sm">
      <Image
        src={images[currentIndex]}
        alt={`Special Sustainable Award - Image ${currentIndex + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 384px"
      />
      {/* Navigation Arrows */}
      <button
        onClick={prevImage}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextImage}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-6' : 'bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}