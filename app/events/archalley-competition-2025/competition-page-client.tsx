"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ChevronRight } from "lucide-react"

export default function CompetitionPageClient() {
  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 scroll-smooth relative">
      {/* Fixed Background Image - Sticky behind all sections except hero */}
      <div 
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: 'url(/uploads/full-page-bg.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />

      {/* Hero Section - Has solid background to cover fixed bg */}
      <section className="relative w-full z-30 bg-slate-900">
        <div className="relative w-full h-[720px] md:h-[820px] lg:h-[900px]">
          <Image
            src="/uploads/hero-bg-img-1.webp"
            alt="Christmas in Future"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center px-4 md:px-6 lg:px-8">
            <div className="max-w-7xl w-full flex flex-col items-end text-right space-y-8 md:space-y-10 lg:space-y-12">
              <h1 className="font-aquire uppercase mb-12">
                <span 
                  className="block text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-[#C00000] via-[#6A4A60] via-[#95B3D7] to-[#376092] bg-clip-text text-transparent mb-4 md:mb-6"
                  style={{ WebkitBoxReflect: 'below 0 linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 30%, transparent 50%)' }}
                >
                  CHRISTMAS IN
                </span>
                <span 
                  className="block text-6xl md:text-7xl lg:text-8xl bg-gradient-to-r from-[#C00000] via-[#6A4A60] via-[#95B3D7] to-[#376092] bg-clip-text text-transparent"
                  style={{ WebkitBoxReflect: 'below 0 linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 30%, transparent 50%)' }}
                >
                  FUTURE
                </span>
            </h1>
              <div className="text-xl md:text-2xl lg:text-3xl text-gray-300">
                <p className="mb-4 md:mb-5">Innovative Christmas Tree</p>
                <p className="mb-4 md:mb-5">"Design, Create & Decorate"</p>
                <p>Competition</p>
              </div>
              <div className="mb-8">
                <h3 className="text-lg md:text-xl font-bold text-blue-400 mb-4">Official Partners</h3>
                <div className="flex flex-wrap justify-end items-center gap-6">
                  <div className="h-16 md:h-20 flex items-center">
                    <Image
                      src="/uploads/A-Plus-Logo.jpg"
                      alt="A PLUS"
                      width={150}
                      height={80}
                      className="object-contain h-full w-auto"
                    />
                  </div>
                  <div className="h-16 md:h-20 flex items-center">
                    <Image
                      src="/uploads/ABrand-Logo.jpg"
                      alt="A BRAND"
                      width={150}
                      height={80}
                      className="object-contain h-full w-auto"
                    />
                  </div>
                </div>
              </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg"
              >
                <Link href="/events/archalley-competition-2025/register">
                  Register Now
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="text-blue-400 hover:bg-blue-500/10 px-8 py-6 text-lg"
              >
                <Link href="#theme">Learn More</Link>
              </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Theme Section */}
      <section id="theme" className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-400 mb-6 uppercase tracking-wide text-center">
              A THEME THAT REIMAGINES TRADITION
            </h2>
            <div className="text-2xl md:text-3xl text-center mb-6">
              <span className="text-red-500">
                What will a Christmas tree look like in<br />
              </span>
              <span className="text-red-500 text-3xl md:text-4xl font-bold">
                50 years?
              </span>
            </div>
            <div className="text-xl md:text-2xl text-gray-300 text-center mb-6">
              Will it float, glow, or live in the metaverse? This year's<br />
              competition invites you to imagine the "tree of tomorrow."
            </div>
            
            <div className="mb-6"></div>
            
            <div className="text-lg md:text-xl text-gray-300 text-center mb-6">
              Participants are encouraged to explore<br />
              <span className="text-red-500">unconventional, futuristic, and conceptual interpretations,</span><br />
              from virtual models to physical tree designs.
            </div>
            
            <div className="mb-6"></div>
            
            <div className="text-lg md:text-xl text-gray-300 text-center">
              Your tree can be<br />
              either minimal or detailed, digital, tech-infused, or<br />
              completely surreal.<br />
              There are no rules... Only imagination.
            </div>
          </div>
        </div>
      </section>

      {/* Contribution Section */}
      <section className="relative min-h-[600px] bg-slate-800/50 z-20 overflow-hidden">
        {/* Full-width overlays - extend full width of section */}
        <div className="absolute inset-0 left-0 w-1/2 h-full bg-gradient-to-br from-white/20 via-blue-500/30 to-white/20" />
        <div className="absolute inset-0 right-0 w-1/2 h-full bg-gradient-to-bl from-red-500/40 via-red-600/30 to-red-500/40" />
        
        {/* Content - Constrained to default width */}
        <div className="relative z-10 min-h-[600px] flex items-center px-4 md:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
              {/* Left Column Content */}
              <div className="relative z-10 flex flex-col justify-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  The Spirit Of Giving
          </h2>
                
                <div className="mb-6"></div>
                
                <p className="text-xl md:text-2xl text-white mb-4">
                  <strong>15% of your fee supports SOS<br />Children's Villages Sri Lanka</strong>
          </p>
                <p className="text-lg md:text-xl text-white mb-6">
                  - nurturing children today and investing<br />in their futures.
                </p>
                
                <div className="mb-6"></div>
                
              <div className="flex items-center justify-center mb-6">
                <Image
                  src="/uploads/sos-logo-2.webp"
                  alt="SOS Children's Villages"
                    width={200}
                    height={200}
                  className="object-contain"
                />
              </div>
                
                <div className="mb-6"></div>
                
                <p className="text-lg md:text-xl text-white">
                  Your creativity doesn't just shine, it <strong>gives back</strong> to people and the planet.
              </p>
            </div>

              {/* Right Column Content */}
              <div className="relative z-10 flex flex-col justify-center">
                <div className="flex-1"></div>
                <div className="flex-1"></div>
                <div className="flex-1"></div>
                
                <p className="text-xl md:text-2xl text-white text-center">
                  For <strong>every entry submitted</strong>, we will <strong>plant a tree</strong>,<br />helping rebuild the planet's future canopy.
              </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Design Considerations Section */}
      <section className="relative min-h-[600px] z-20 overflow-hidden">
        {/* Full-width backgrounds - extend full width of section */}
        {/* Left half - Background Image with Red Overlay */}
        <div className="absolute inset-0 left-0 w-1/2 h-full">
          <Image
            src="/uploads/DESIGN_CONSIDERATIONS_1.webp"
            alt="Design Considerations"
            fill
            className="object-cover"
          />
          {/* Red Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 via-red-600/30 to-red-500/40" />
        </div>
        {/* Right half - Gradient Background */}
        <div 
          className="absolute inset-0 right-0 w-1/2 h-full"
          style={{
            background: 'linear-gradient(to bottom, #10253F, #090A0C)'
          }}
        />
        
        {/* Content - Constrained to default width */}
        <div className="relative z-10 min-h-[600px] flex items-center px-4 md:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
              {/* Left Column Content */}
              <div className="relative z-10 flex flex-col justify-between pr-6 md:pr-8 lg:pr-12 text-right">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wide">
                    DESIGN<br />CONSIDERATIONS
          </h2>
                </div>
                <div>
                  <p className="text-xl md:text-2xl text-white">
                    All entrants should respond to the Competition<br /> theme, "Christmas in future"
          </p>
                </div>
              </div>

              {/* Right Column Content */}
              <div className="relative z-10 flex flex-col pl-6 md:pl-8 lg:pl-12">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">
                  What makes a futuristic tree stand out?
                </h3>
                
                <div className="mb-8"></div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-red-500 mb-2">
                      Concept & Originality
                    </h4>
                <p className="text-gray-300">
                  The idea should be fresh, imaginative, and clearly aligned with the futuristic theme.
                </p>
              </div>
                  
                  <div className="mb-6"></div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-red-500 mb-2">
                      The design as a whole
                    </h4>
                <p className="text-gray-300">
                  The product should be designed and composed as a whole relevant to the chosen category.
                </p>
              </div>
                  
                  <div className="mb-6"></div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-red-500 mb-2">
                      Theme Relevance
                    </h4>
                <p className="text-gray-300">
                  The overall design must respond thoughtfully to the idea of "Christmas in the Future" - bold or subtle.
                </p>
              </div>
                  
                  <div className="mb-6"></div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-red-500 mb-2">
                      Visual Aesthetics
                    </h4>
                <p className="text-gray-300">
                  The product should be aesthetically appealing while being innovative.
                </p>
              </div>
                  
                  <div className="mb-6"></div>
                  
                  <div>
                    <h4 className="text-xl font-bold text-red-500 mb-2">
                      Material & Technique
                    </h4>
                <p className="text-gray-300">
                  Use of unconventional, digital, or experimental methods is encouraged. Consider the lifecycle of your design and how it's made.
                </p>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submission Categories & Who Can Join */}
      <section className="relative min-h-[600px] z-20 overflow-hidden">
        {/* Full-width background - Right half with background image */}
        <div className="absolute inset-0 right-0 w-1/2 h-full">
          <Image
            src="/uploads/SUBMISSION_CATEGORIES_1.webp"
            alt="Submission Categories"
            fill
            className="object-cover"
          />
        </div>
        
        {/* Content - Constrained to default width */}
        <div className="relative z-10 min-h-[600px] flex items-center px-4 md:px-6 lg:px-8 py-16 md:py-24">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
              {/* Left Column Content - Transparent background */}
              <div className="relative z-10 flex flex-col pr-6 md:pr-8 lg:pr-12">
                <h2 className="text-3xl md:text-4xl font-bold text-blue-400 mb-6 uppercase tracking-wide">
                  SUBMISSION CATEGORIES
                </h2>
                
                <div className="mb-6"></div>
                
                <ul className="space-y-4 mb-6 text-gray-300 text-lg md:text-xl">
                  <li>Physical Tree Category</li>
                  <li>Digital Tree Category</li>
                  <li>Kid's Tree Category (Age under 12)</li>
                </ul>
                
                <div className="mb-6"></div>
                
                <div className="text-gray-300 text-base md:text-lg space-y-4">
                  <p>
                    <strong>Who Can Join</strong><br />
                    Open to all enthusiasts<br />
                    Students | Professionals | Creatives | Anyone with a Vision
                  </p>
                  
                  <p>
                    <strong>Creative Freedom</strong><br />
                    No limits on size, color, materials, or format; as long as it reflects the futuristic theme.
                  </p>
                  
                  <p>
                    <strong>Global Participation</strong><br />
                    Entries accepted locally and internationally. All formats must be submitted online.
                  </p>
                </div>
                
                <div className="mb-6"></div>
                
                <p className="text-sm md:text-base text-gray-400 italic">
                  * Refer terms & conditions for further details.
                </p>
              </div>

              {/* Right Column - Background image (handled by full-width background above) */}
              <div className="relative z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Join the Challenge */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-400 mb-12 uppercase tracking-wide">
            HOW TO JOIN THE CHALLENGE
          </h2>
          
          <div className="mb-6"></div>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-3">
                01. Register for the Competition
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Sign in to the Archalley website and register between 11th November and 24th December 2025 by providing correct information & paying the registration fee.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-3">
                02. Chose your preferred category of participation
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Select one category - Physical, Digital, or Kids' Tree –and follow the terms & conditions for that category; non-compliance may lead to disqualification.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-3">
                03. Create/Design your Christmas tree
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Enjoy full creative freedom on color, materials, size, and decoration (In compliance with the terms & conditions for your selected category).</li>
                <li>Ensure your design aligns with the Key Design Considerations of the competition.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-3">
                04. Prepare Your Submission Materials
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Compile the require submission items for your selected category.</li>
                <li>You may also add optional document or optional video (per the terms & conditions ) to strengthen your entry.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-red-500 mb-3">
                05. Submission
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Kids' Tree Category - From 11th to 21st December 2025</li>
                <li>Physical Tree Category & Digital Tree Category - From 11th to 24th December 2025</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm md:text-base text-gray-400 italic">
              Note:-Refer to this brochure & terms & conditions for all required information.
            </p>
          </div>
        </div>
      </section>

      {/* Submission Requirements */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-slate-800/50 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-red-500 mb-12 uppercase tracking-wide">
            SUBMISSION REQUIREMENTS
          </h2>
          <div className="bg-slate-800/70 rounded-lg p-8 max-w-4xl mx-auto">
            <ul className="space-y-4 text-gray-300 text-lg">
              <li className="flex items-start">
                <ChevronRight className="w-6 h-6 text-blue-400 mr-2 flex-shrink-0 mt-1" />
                <span><strong className="text-blue-400">Key Photograph (JPG):</strong> This will be the image published for most popular category voting.</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="w-6 h-6 text-red-500 mr-2 flex-shrink-0 mt-1" />
                <span><strong className="text-red-500">Up to 4 other Photographs (JPG):</strong> (minimum of 2)</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="w-6 h-6 text-blue-400 mr-2 flex-shrink-0 mt-1" />
                <span><strong className="text-blue-400">Description of your idea (50-200 words):</strong> (Note: excluded for kids' tree category)</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="w-6 h-6 text-red-500 mr-2 flex-shrink-0 mt-1" />
                <span><strong className="text-red-500">Optional document/panel submission (PDF, &lt; 5 MB):</strong> Can include sketches, materials, process, etc. (Note: excluded for kids' tree category)</span>
              </li>
              <li className="flex items-start">
                <ChevronRight className="w-6 h-6 text-blue-400 mr-2 flex-shrink-0 mt-1" />
                <span><strong className="text-blue-400">Optional Video (mp4, &lt; 10 MB):</strong> (Note: excluded for kids' tree category)</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          {/* Top Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 uppercase tracking-wide">
              AWARDS
          </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-2">
              Total prize fund more than
            </p>
            <p className="text-4xl md:text-5xl font-bold text-red-500 mb-4">
              LKR 500,000.00
            </p>
            <p className="text-base md:text-lg text-gray-300 max-w-4xl mx-auto">
              Archalley will award a total of LKR 325,000.00 in prize money to competition winners as follows:
          </p>
        </div>

          {/* Main Prize Categories - Two Columns with Equal Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-stretch">
            {/* Physical Category - Left Box */}
            <div className="bg-blue-500/10 rounded-lg p-6 flex flex-col h-full">
              <h3 className="text-xl md:text-2xl font-bold text-blue-400 mb-6 uppercase text-center">
                PHYSICAL CATEGORY
              </h3>
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="bg-red-900/80 rounded-lg p-6 text-center">
                  <p className="text-white mb-2">1st Prize</p>
                  <p className="text-3xl md:text-4xl font-bold text-white">LKR 150,000.00</p>
                </div>
                <div className="bg-red-900/80 rounded-lg p-6 text-center">
                  <p className="text-white mb-2">2nd Prize</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">LKR 50,000.00</p>
                </div>
                <div className="bg-red-900/80 rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                  <p className="text-white mb-2">3rd Prize</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">LKR 25,000</p>
                </div>
              </div>
            </div>

            {/* Digital Category - Right Box */}
            <div className="bg-blue-500/10 rounded-lg p-6 flex flex-col h-full">
              <h3 className="text-xl md:text-2xl font-bold text-blue-400 mb-6 uppercase text-center">
                DIGITAL CATEGORY
            </h3>
              <div className="flex-1 flex flex-col gap-3">
                <div className="bg-red-900/80 rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                  <p className="text-white mb-2">1st Prize</p>
                  <p className="text-3xl md:text-4xl font-bold text-white">TABLET</p>
                </div>
                <div className="bg-red-900/80 rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                  <p className="text-white mb-2">2nd Prize</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">DRAWING PAD</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Awards - Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
            {/* Archalley Most Popular Tree Award */}
            <div className="bg-red-900/80 rounded-lg p-6 text-center flex flex-col justify-center">
              <p className="text-white mb-4 text-lg md:text-xl font-semibold">Archalley Most Popular Tree Award</p>
              <p className="text-3xl md:text-4xl font-bold text-white">LKR 100,000.00</p>
            </div>

            {/* Kids' Category */}
            <div className="bg-red-900/80 rounded-lg p-6 text-center flex flex-col justify-center">
              <p className="text-white mb-3 text-lg md:text-xl font-semibold">Kids' category</p>
              <p className="text-white mb-2 text-base">A Gift per each Submission</p>
              <p className="text-white text-sm md:text-base">Certificate of participation</p>
            </div>

            {/* Honorable Mentions & Finalists - Two Stacked Blocks */}
            <div className="flex flex-col gap-3 h-full">
              <div className="bg-red-900/80 rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                <p className="text-white mb-2 text-lg md:text-xl font-semibold">3 Honorable mentions</p>
                <p className="text-white text-sm md:text-base">Certificate of achievement</p>
              </div>
              <div className="bg-red-900/80 rounded-lg p-6 text-center flex-1 flex flex-col justify-center">
                <p className="text-white mb-2 text-lg md:text-xl font-semibold">10 Finalists</p>
                <p className="text-white text-sm md:text-base">From Each Category</p>
                <p className="text-white text-sm md:text-base">will be announced</p>
              </div>
            </div>
          </div>

          {/* Notes and Footer */}
          <div className="space-y-4 text-gray-300 text-sm md:text-base">
            <ul className="list-disc list-inside space-y-2 max-w-4xl mx-auto">
              <li>All winners will receive a certificate of achievement in addition to their relevant prize money.</li>
              <li>All entrants will receive an E-certificate of participation.</li>
              <li>Prize money for foreign participants will be converted to USD according to current Central Bank exchange rate.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-slate-900/80 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 uppercase tracking-wide">
            TIMELINE
          </h2>
          
          <div className="space-y-3">
            {/* Registration Phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1 - Section Heading (only for first row) */}
              <div className="flex items-center">
                <h3 className="text-xl md:text-2xl font-bold text-red-500 uppercase">Registration</h3>
              </div>
              {/* Column 2 - Event Description */}
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Competition Registration starts</span>
              </div>
              {/* Column 3 - Date */}
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">11<sup>th</sup> November</span>
              </div>
            </div>

            {/* Registration - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {/* Empty for section heading column */}
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Early bird registration</span>
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">11<sup>th</sup> November -20<sup>th</sup> November</span>
              </div>
            </div>

            {/* Registration - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {/* Empty for section heading column */}
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Standard registration</span>
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">21<sup>st</sup> November -20<sup>th</sup> December</span>
              </div>
            </div>

            {/* Registration - Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {/* Empty for section heading column */}
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Late Registration</span>
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">21<sup>st</sup> December -24<sup>th</sup> December</span>
              </div>
            </div>

            <hr className="my-6" />

            {/* Submissions Phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1 - Section Heading (only for first row) */}
              <div className="flex items-center">
                <h3 className="text-xl md:text-2xl font-bold text-red-500 uppercase">Submissions</h3>
              </div>
              {/* Column 2 - Event Description */}
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Submission Start</span>
              </div>
              {/* Column 3 - Date */}
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">11<sup>th</sup> December</span>
              </div>
            </div>

            {/* Submissions - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {/* Empty for section heading column */}
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Closing Date for FAQ</span>
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">20<sup>th</sup> December</span>
              </div>
            </div>

            {/* Submissions - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {/* Empty for section heading column */}
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Submission Deadline for Kids' Category</span>
                  </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">21<sup>st</sup> December</span>
                  </div>
                </div>

            {/* Submissions - Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {/* Empty for section heading column */}
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Submission Deadline for other categories</span>
                  </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">24<sup>th</sup> December</span>
                  </div>
                </div>

            <hr className="my-6" />

            {/* Voting & Results Phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1 - Section Heading (only for first row) */}
              <div className="flex items-center">
                <h3 className="text-xl md:text-2xl font-bold text-red-500 uppercase">Voting & Results</h3>
              </div>
              {/* Column 2 - Event Description */}
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Most popular category voting</span>
                  </div>
              {/* Column 3 - Date */}
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">25<sup>th</sup> December to 4<sup>th</sup> January</span>
                  </div>
                </div>

            {/* Voting & Results - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                {/* Empty for section heading column */}
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white text-sm md:text-base">Announcement of the Winners</span>
              </div>
              <div className="bg-slate-800/90 rounded-md p-4 flex items-center">
                <span className="text-white font-semibold text-sm md:text-base">10<sup>th</sup> January</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-slate-900/80 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 uppercase tracking-wide">
            REGISTRATION
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Left Side - Registration Content */}
            <div className="space-y-8">
              {/* Earlybird Registration */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Earlybird Registration</h3>
                <p className="text-gray-300 text-lg mb-4">(11<sup>th</sup> November - 20<sup>th</sup> November)</p>
                <div className="space-y-2 text-white">
                  <div className="flex justify-between items-center">
                    <span>Single Entry:</span>
                    <span className="font-semibold">LKR 2,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Group Entry:</span>
                    <span className="font-semibold">LKR 4,000</span>
                  </div>
                </div>
              </div>

              {/* Standard Registration */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Standard Registration</h3>
                <p className="text-gray-300 text-lg mb-4">(21<sup>st</sup> November - 20<sup>th</sup> December)</p>
                <div className="space-y-2 text-white">
                  <div className="flex justify-between items-center">
                    <span>Student Entry:</span>
                    <span className="font-semibold">LKR 2,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Single Entry:</span>
                    <span className="font-semibold">LKR 3,000</span>
                </div>
                  <div className="flex justify-between items-center">
                    <span>Group Entry:</span>
                    <span className="font-semibold">LKR 5,000</span>
              </div>
          </div>
        </div>

              {/* Late Registration */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Late Registration</h3>
                <p className="text-gray-300 text-lg mb-4">(21<sup>st</sup> December - 24<sup>th</sup> December)</p>
                <div className="space-y-2 text-white">
                  <div className="flex justify-between items-center">
                    <span>Student Entry:</span>
                    <span className="font-semibold">LKR 2,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Single Entry:</span>
                    <span className="font-semibold">LKR 5,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Group Entry:</span>
                    <span className="font-semibold">LKR 8,000</span>
                  </div>
          </div>
        </div>

              {/* Kids' Tree Category Registration */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Kids' Tree Category Registration</h3>
                <p className="text-gray-300 text-lg mb-4">(21<sup>st</sup> November to 21<sup>st</sup> December)</p>
                <div className="space-y-2 text-white mb-3">
                  <div className="flex justify-between items-center">
                    <span>Single Entry:</span>
                    <span className="font-semibold">LKR 2,000</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm italic">*Only single entries are allowed in kids' category.</p>
              </div>

              {/* General Note */}
              <div className="pt-4">
                <p className="text-gray-400 text-sm italic">
                  * Registration fee for foreign participants will be converted to USD according to current Central Bank exchange rate.
                </p>
              </div>

              {/* Register Now Button */}
              <div className="pt-4">
                <Button
                  asChild
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg"
                >
                  <Link href="/events/archalley-competition-2025/register">
                    Register Now
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Side - Image */}
            <div className="relative w-full h-full min-h-[600px] rounded-lg overflow-hidden">
              <Image
                src="/uploads/Registration-1.webp"
                alt="Registration"
                fill
                className="object-cover"
              />
        </div>
      </div>
        </div>
      </section>

      {/* Jury Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-slate-800/50 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-400 mb-12 uppercase tracking-wide">
            JURY PANEL
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              {
                name: "Prof. Narein Perera",
                bio: [
                  "Head of the Department",
                  "Faculty of Architecture,",
                  "University of Moratuwa,",
                  "Sri Lanka.",
                ],
                image: "/uploads/narein-perera.jpg",
              },
              {
                name: "Dinesh Chandrasena",
                bio: [
                  "Designer & Academic Director of College of Fashion and Design,",
                  "Colombo,",
                  "Sri Lanka.",
                ],
                image: "/uploads/dinesh-chandrasena.jpg",
              },
              {
                name: "Yashodara Pathanjali",
                bio: [
                  "Principal and Co-Founder of Independent Collective School,",
                  "Colombo,",
                  "Sri Lanka.",
                ],
                image: "/uploads/yashodara-pathanjali.png",
              },
              {
                name: "Dr. Kamal Wasala",
                bio: [
                  "Senior Lecturer / Field Coordinator - Product Design /",
                  "Coordinator - Timber Design and Innovation Centre, University of Moratuwa,",
                  "Sri Lanka.",
                ],
                image: "/uploads/kamal-wasala.jpg",
              },
              {
                name: "Alley",
                bio: ["Non Biological Juror"],
                image: "/uploads/alley-juror.webp",
              },
            ].map((jury, index) => (
              <div key={index} className="bg-slate-800/70 rounded-lg p-6 text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                  <Image
                    src={jury.image}
                    alt={jury.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{jury.name}</h3>
                <div className="text-sm text-gray-400 space-y-1">
                  {jury.bio.map((line, bioIndex) => (
                    <p key={bioIndex}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terms & Conditions Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-red-500 mb-12 uppercase tracking-wide">
            TERMS & CONDITIONS
          </h2>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="physical-tree" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Physical Tree Category
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Terms and conditions for the Physical Tree Category will be displayed here. This includes requirements for physical submissions, material specifications, size limitations, and other relevant guidelines.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="digital-tree" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Digital Tree Category
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Terms and conditions for the Digital Tree Category will be displayed here. This includes file format requirements, resolution specifications, software requirements, and other relevant guidelines.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="kids-tree" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Kids' Tree Category
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Terms and conditions for the Kids' Tree Category will be displayed here. This includes age requirements, submission guidelines, and other relevant information for participants under 12 years of age.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="submission-formats" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Submission Formats
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Detailed information about accepted submission formats, file specifications, size limitations, and technical requirements.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="group-entry" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Group Entry
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Guidelines for group submissions, including maximum number of participants, registration requirements, and attribution guidelines.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="registration-identification" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Registration & Identification
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Requirements for registration, identification documents, and participant information.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="submission-method" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Submission Method, Format & Deadline
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Detailed instructions on how to submit entries, accepted formats, file naming conventions, and submission deadlines.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="multiple-entries" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Multiple Entries & Duplicate Products
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Policies regarding multiple entries, duplicate submissions, and originality requirements.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="judging-jury" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Judging & Jury Protocol
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Information about the judging process, jury selection criteria, evaluation methods, and scoring guidelines.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="intellectual-property" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Intellectual Property & Permissions
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Guidelines regarding intellectual property rights, copyright, usage rights, and permissions for submitted work.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="archalley-rights" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Archalley Rights & Liability
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Terms regarding Archalley's rights, responsibilities, and liability limitations.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="winner-notification" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Winner Notification & Prizes
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Information about winner notification process, prize distribution, and award ceremony details.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-slate-800/50 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-400 mb-12 uppercase tracking-wide">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="faq-1" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Can I submit more than one entry?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Yes! You can submit multiple entries. Each entry requires a separate registration and fee payment.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Can I collaborate with others?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Yes. Group submissions are welcome. Please register as a group entry and include all team members' information during registration.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  Are international entries allowed?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Absolutely! The competition is open to participants from around the world. All submissions must be made online through our platform.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Do I have to build the physical model?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Only if you choose the Physical Tree Category. For the Digital Tree Category, you only need to submit digital files. For Kids' Category, you can choose either physical or digital submission.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-5" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  What format should I submit digital work in?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>JPG format is required for all images. For documents, PDF format is accepted (max 5 MB). Videos should be in MP4 format (max 10 MB).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-6" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-red-500 hover:text-red-400 text-left">
                  Can the tree be of any size?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Yes, There are no limitations on size, color, materials, or format; as long as it reflects the futuristic theme and can be properly documented for submission.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-7" className="bg-slate-800/70 rounded-lg px-6">
                <AccordionTrigger className="text-blue-400 hover:text-blue-300 text-left">
                  I'm 12 or younger. Can I join?
                </AccordionTrigger>
                <AccordionContent className="text-gray-300 pt-4">
                  <p>Yes! Submit under the Kids' Tree Category. The registration fee is LKR 2,000 for single entries only. Parents or guardians should assist with registration and submission.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative bg-slate-950/90 py-12 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          {/* Official Partners */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Official Partners</h3>
            <div className="flex flex-wrap justify-center items-center gap-6">
              <div className="h-24 md:h-32 flex items-center">
                <Image
                  src="/uploads/ABrand-Logo.jpg"
                  alt="A BRAND"
                  width={200}
                  height={128}
                  className="object-contain h-full w-auto"
                />
              </div>
              <div className="h-24 md:h-32 flex items-center">
                <Image
                  src="/uploads/A-Plus-Logo.jpg"
                  alt="A PLUS"
                  width={200}
                  height={128}
                  className="object-contain h-full w-auto"
                />
              </div>
        </div>
      </div>
        </div>
      </footer>
    </div>
  )
}
