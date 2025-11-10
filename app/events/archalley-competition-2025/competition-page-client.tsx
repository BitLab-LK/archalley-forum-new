"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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
                <h3 className="text-lg md:text-xl font-bold text-white mb-4">Official Partners</h3>
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
            <h2 id="theme" className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase tracking-wide text-center scroll-mt-20">
              <a href="#theme" className="hover:underline">A THEME THAT REIMAGINES TRADITION</a>
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
                <h2 id="contribution" className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase tracking-wide scroll-mt-20">
                  <a href="#contribution" className="hover:underline">THE SPIRIT OF GIVING</a>
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
                  <h2 id="design-considerations" className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wide scroll-mt-20">
                    <a href="#design-considerations" className="hover:underline">DESIGN<br />CONSIDERATIONS</a>
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
                <h2 id="submission-categories" className="text-3xl md:text-4xl font-bold text-white mb-6 uppercase tracking-wide scroll-mt-20">
                  <a href="#submission-categories" className="hover:underline">SUBMISSION CATEGORIES</a>
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
          <h2 id="how-to-join" className="text-3xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#how-to-join" className="hover:underline">HOW TO JOIN THE CHALLENGE</a>
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
          <h2 id="submission-requirements" className="text-3xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#submission-requirements" className="hover:underline">SUBMISSION REQUIREMENTS</a>
          </h2>
          <div className="max-w-7xl">
            <div className="space-y-6 text-white text-lg text-left">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Key Photograph (JPG)
                </h3>
                <p className="text-white">
                  This will be the image published for most popular category voting, total product to be clearly visible
                </p>
              </div>
              
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Up to 4 other Photographs (JPG)
                </h3>
                <p className="text-white">
                  minimum of 2
                </p>
              </div>
              
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Description of your idea
                </h3>
                <p className="text-white mb-1">
                  50-200 words
                </p>
                <p className="text-white italic">
                  Note: excluded for kids' tree category
                </p>
            </div>
              
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Optional document/panel submission (PDF)
                </h3>
                <p className="text-white mb-1">
                  Can include sketches, materials, process, etc.
                </p>
                <p className="text-white mb-1">
                  The document should be less than 5 MB
                </p>
                <p className="text-white italic">
                  Note: excluded for kids' tree category
                </p>
              </div>
              
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Optional Video (mp4)
                </h3>
                <p className="text-white mb-1">
                  The document should be less than 10 MB
                </p>
                <p className="text-white italic">
                  Note: excluded for kids' tree category
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <p className="text-sm md:text-base text-white italic">
                * Submission requirements are applicable for all categories other than the kids' category as mentioned in above notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          {/* Top Section */}
          <div className="text-center mb-12">
            <h2 id="awards" className="text-3xl md:text-4xl font-bold text-white mb-4 uppercase tracking-wide scroll-mt-20">
              <a href="#awards" className="hover:underline">AWARDS</a>
          </h2>
            <p className="text-lg md:text-xl text-gray-300 mb-2">
              Total prize fund more than
            </p>
            <p className="text-4xl md:text-5xl font-bold text-white mb-4">
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
          <h2 id="timeline" className="text-3xl md:text-4xl font-bold text-white mb-12 uppercase tracking-wide text-center scroll-mt-20">
            <a href="#timeline" className="hover:underline">TIMELINE</a>
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
          <h2 id="registration" className="text-3xl md:text-4xl font-bold text-white mb-12 uppercase tracking-wide text-center scroll-mt-20">
            <a href="#registration" className="hover:underline">REGISTRATION</a>
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
          <h2 id="jury-panel" className="text-3xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#jury-panel" className="hover:underline">JURY PANEL</a>
          </h2>
          {/* First 4 Jurors - Top Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[
              {
                name: "Prof. Narein Perera",
                bio: [
                  "Head,",
                  "Department of Architecture,",
                  "University of Moratuwa",
                  "Sri Lanka.",
                ],
                image: "/uploads/narein-perera.jpg",
              },
              {
                name: "Dinesh Chandrasena",
                bio: [
                  "Designer & Academic Director of",
                  "College of Fashion and Design,",
                  "Colombo, Sri Lanka.",
                ],
                image: "/uploads/dinesh-chandrasena.jpg",
              },
              {
                name: "Yasodhara Pathanjali",
                bio: [
                  "Principal and Co-Founder of",
                  "Independent Collective School,",
                  "Colombo, Sri Lanka.",
                ],
                image: "/uploads/yashodara-pathanjali.png",
              },
              {
                name: "Dr. Kamal Wasala",
                bio: [
                  "Senior Lecturer",
                  "in Industrial/ Product Design,",
                  "Department of Integrated Design,",
                  "University of Moratuwa, Sri Lanka.",
                ],
                image: "/uploads/kamal-wasala.jpg",
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
                <div className="text-sm space-y-1" style={{ color: '#FFA000' }}>
                  {jury.bio.map((line, bioIndex) => (
                    <p key={bioIndex}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Alley - Centered Banner Row */}
          <div className="flex justify-center">
            <div className="bg-slate-800/70 rounded-lg p-6 text-center max-w-2xl w-full">
              <div className="relative w-full h-32 md:h-40 mx-auto mb-4 rounded-lg overflow-hidden">
                <Image
                  src="/uploads/alley-juror-2.webp"
                  alt="Alley"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Alley</h3>
              <div className="text-sm space-y-1" style={{ color: '#FFA000' }}>
                <p>Non Biological Juror</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms & Conditions Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 id="terms-conditions" className="text-3xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#terms-conditions" className="hover:underline">TERMS & CONDITIONS</a>
          </h2>
          <div className="max-w-7xl mx-auto">
            {/* Introduction */}
            <div className="mb-8 text-white text-lg space-y-4">
              <p>
                We invite everyone, irrespective of their age, gender, profession, or qualifications, to join the competition and present the product.
              </p>
              <p>
                All entries should respond directly to the competition—to design a Christmas tree based on the theme, 'Christmas in Future."
              </p>
            </div>
            
            {/* Terms in Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Physical Tree Category */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Physical Tree Category</h3>
                <div className="text-white space-y-3 text-sm">
                  <p><strong>Build it for real:</strong> The tree must be a physically made product (in 2D or 3D form) and photographed for submission.</p>
                  <p><strong>Real photos only:</strong> Upload actual photographs of the built tree. Post-processing is limited to basic global color/exposure correction and cropping.</p>
                  <p><strong>Strictly no AI or graphic edits:</strong> AI-generated/AI-modified images, graphically enhances, compositing, retouching, or graphic enhancements are not permitted and may lead to disqualification.</p>
                  <p>Graphical representations using 3D modeling software, 3D renders, Drawings, printed graphics will not be accepted as the product under this category.</p>
                  <p><strong>Physical Tree Category - Accepted Formats:</strong> Sewing / Fabric crafts, Sculptures, Crafted trees / Tree models</p>
                </div>
              </div>
              
              {/* Digital Tree Category */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Digital Tree Category</h3>
                <div className="text-white space-y-3 text-sm">
                  <p><strong>Digital Tree Category - Accepted Formats:</strong> Paintings, drawings, digital illustrations, mixed media, AI-generated or AI-enhanced images, 3D-rendered images, and graphical representations created using 3D modeling software.</p>
                  <p><strong>Originality & rights:</strong> The entry must be your original work or use assets you are legally licensed to use. Do not include copyrighted logos/characters or third-party assets without written permission. You are responsible for all rights and clearances.</p>
                  <p><strong>AI usage disclosure:</strong> AI-assisted work is allowed. By submitting, you warrant that no third-party rights are infringed and that any model/assets/prompts used are permitted for this purpose.</p>
                  <p><strong>Compliance:</strong> Entries that breach these terms or the general competition rules may be disqualified.</p>
                </div>
              </div>
              
              {/* Kids' Tree Category */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Kids' Tree Category</h3>
                <div className="text-white space-y-3 text-sm">
                  <p><strong>No winners selected:</strong> This category will not be judged by the jury and is not eligible for popularity voting or prizes.</p>
                  <p><strong>Participation recognition:</strong> Each completed submission receives one gift and a certificate of participation.</p>
                  <p><strong>Single entry policy:</strong> Only one (1) entry per participant is permitted.</p>
                  <p><strong>No group entries:</strong> Group/team entries are not allowed in the Kids' Category.</p>
                  <p><strong>Parent/Guardian responsibility:</strong> The parent/guardian is responsible for entering the child's accurate details, submission, and delivery address, including a valid phone number.</p>
                  <p><strong>Delivery address required:</strong> A correct, complete delivery address and phone number are mandatory. Archalley is not liable for non-delivery, delays, misplacement, or damage arising from incorrect/incomplete details or third-party courier issues.</p>
                </div>
              </div>
              
              {/* Submission Formats */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Submission Formats (All Categories)</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>Submit files via the Archalley web portal only (no external links or email). Do not include names, logos, watermarks, or identifying marks on images or filenames.</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Key Photograph (JPG, max 5 MB)</strong> — required; whole product must be clearly visible; used for Most Popular voting.</li>
                    <li><strong>Additional Photographs:</strong> 2–4 JPGs, each max 5 MB.</li>
                    <li><strong>Description:</strong> 50–200 words (not required for Kids' Category).</li>
                  </ul>
                </div>
              </div>
              
              {/* Optional Documents */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Optional Documents (Physical, Digital Tree Categories Only)</h3>
                <div className="text-white space-y-3 text-sm">
                  <p><strong>Optional PDF:</strong> Entrants may upload one (1) additional PDF (sketches, materials, drawings, graphics, process documentation), max 5 MB.</p>
                  <p><strong>Optional Video:</strong> Entrants may upload one (1) additional video (e.g., physical tree clip, AI video, animated walkthrough), max 10 MB.</p>
                  <p><strong>Submission channel:</strong> Only files uploaded via the Archalley web portal will be considered. External links (e.g., Google Drive), emails, or other reference documents/links will not be accepted for evaluation.</p>
                  <p><strong>Note:</strong> These are optional and do not replace the compulsory submission requirements for each category.</p>
                </div>
              </div>
              
              {/* Group Entry */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Group Entry</h3>
                <div className="text-white space-y-3 text-sm">
                  <p><strong>Eligibility.</strong> Under Group entry, teams, and company entries are permitted. A team may include up to ten (10) participants.</p>
                  <p>If entering under a company name, the entrant represents and warrants that (i) the company has authorized participation in the competition; and (ii) the entrant has the right and authority to submit the entry and all related materials on the company's behalf. Archalley is not liable for any unauthorized submissions, fraud, or misrepresentation by the entrant or team and may, at its discretion, disqualify the entry and recover any costs or damages arising therefrom.</p>
                  <p><strong>Documentation.</strong> Archalley may request supporting documents to verify company authorization and authenticity. Failure to provide satisfactory documentation may result in disqualification.</p>
                  <p>By entering as a team, the entrant warrants that all team members are correctly identified and the entrant has authority to submit on the team's behalf; Archalley is not liable for unauthorized submissions, fraud, misrepresentation, or disputes, may disqualify entries and recover costs, and the entrant agrees to indemnify Archalley.</p>
                </div>
              </div>
              
              {/* Registration & Identification */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Registration & Identification</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>After your registration has been approved, you will be sent a unique identification number for your entry, which will be necessary to submit your proposal. If you haven't received a confirmation within two business days, please contact us at projects@archalley.com</p>
                  <p>For kid's category the guardian is liable for entering the details of the kid & his submission & address & other details.</p>
                  <p>The registration number and the name are the only forms of identification for the entries.</p>
                  <p>The registration fee is non-refundable.</p>
                  <p>English is to be used as the language of communication for all documents.</p>
                </div>
              </div>
              
              {/* Submission Method, Format & Deadline */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Submission Method, Format & Deadline</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>Entries must be registered and submitted only via the Archalley web portal.</p>
                  <p>Entries must be submitted as JPG and must not exceed 5 MB per upload in the portal.</p>
                  <p>The submission deadline is 11:59 PM IST, 24 December 2025. Submissions after this deadline will not be considered.</p>
                </div>
              </div>
              
              {/* Multiple Entries & Duplicate Products */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Multiple Entries & Duplicate Products</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>Participants are free to submit multiple entries with different products, but each entry must be registered separately.</p>
                  <p>Multiple submissions by the same entrant with the same product may result in rejection of all relevant entries.</p>
                  <p>Multiple submissions of the same product by different participants may result in rejection of all relevant entries.</p>
                </div>
              </div>
              
              {/* Judging & Jury Protocol */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Judging & Jury Protocol</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>Entries will be judged on their artistic merit and creative responses to the requirement to design a Christmas tree based on the theme "Christmas in future."</p>
                  <p>Entries will be presented anonymously for judging purposes.</p>
                  <p>The judges' decisions will be final and binding in all matters, and no correspondence will be entered into.</p>
                  <p>The entrant/entrants must not contact the jury under any circumstances.</p>
                </div>
              </div>
              
              {/* Verification & Compliance */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Verification & Compliance</h3>
                <div className="text-white space-y-3 text-sm">
                  <p><strong>Verification:</strong> Archalley reserves the right to request additional proof of physical fabrication (e.g., build photos, process images) and to disqualify any entry that does not conform to these terms.</p>
                  <p><strong>Non-compliance:</strong> Entries that do not meet the above will be disqualified.</p>
                </div>
              </div>
              
              {/* Intellectual Property, Permissions & Indemnity */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Intellectual Property, Permissions & Indemnity</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>All copyright and any other intellectual property rights in the product photographs are vested in the entrant. The entrant confirms they have not assigned, licensed, disposed of, or otherwise encumbered any of their rights in the product.</p>
                  <p>The entrant warrants that the entry does not infringe the intellectual property rights of any third party. The entrant(s) will indemnify Archalley against any claims made by third parties in respect of such infringement.</p>
                  <p>By entering the competition, the entrant confirms and warrants that they have the permission of any persons pictured in the product photographs (if any); where the photograph includes a person under the age of 18, the entrant has obtained the consent of the parent or legal guardian for the photo to be published and used by Archalley as contemplated by these terms and conditions.</p>
                </div>
              </div>
              
              {/* Archalley Rights & Liability */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Archalley Rights & Liability</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>Archalley reserves the right to amend the competition schedule or cancel the competition at any point if it deems such action necessary or for reasons beyond its reasonable control. Archalley will not be liable to entrants for any such cancellation; however, entry fees will be refunded in such events.</p>
                  <p>Archalley reserves the right to disqualify, refuse entry or refuse to award the prize to anyone in breach of these terms and conditions.</p>
                  <p>Archalley will not be liable for any loss or damage to any entries and bears no responsibility for incomplete or delayed entries.</p>
                  <p>Archalley reserves the right to inspect all the winning products physically/ verification of AI productions, if required.</p>
                  <p>Winning entrants shall not object to any cropping or other minor alteration of the photographs of their product when used outside the remit of this competition.</p>
                </div>
              </div>
              
              {/* Winner Notification & Prizes */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Winner Notification & Prizes</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>Winning entrants will be notified via email or phone using the contact information provided. If Archalley is unable to contact any winner, or if the prize is not accepted within two days of being notified, the winner will be deemed to have forfeited the prize, and Archalley reserves the right to determine a new winner for that prize or cancel the prize.</p>
                  <p>The winning entrants will receive prize money/gift as announced by Archalley. There will be no alternative to the prizes/gifts.</p>
                </div>
              </div>
              
              {/* License for Winning Entries */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">License for Winning Entries</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>By entering the competition, each winning entrant grants Archalley, the competition sponsors, and all media partners an irrevocable, perpetual license to reproduce, enlarge, publish, or exhibit the product; the entrant's name; product images; product detail documents; and a self-picture of the entrant, mechanically or electronically, on any media worldwide (including the internet).</p>
                </div>
              </div>
              
              {/* Acceptance of Terms */}
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Acceptance of Terms</h3>
                <div className="text-white space-y-3 text-sm">
                  <p>Submitting an entry to the competition indicates acceptance of these terms and conditions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-slate-800/50 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 id="faq" className="text-3xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#faq" className="hover:underline">FAQ</a>
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Q: Can I submit more than one entry?
                </h3>
                <p className="text-white">
                  A: Yes! You can submit multiple entries, But each should go under separate registrations.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Q: Can I collaborate with others?
                </h3>
                <p className="text-white">
                  A: Yes. Group submissions are allowed as a team or a company.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Q: Are international entries allowed?
                </h3>
                <p className="text-white">
                  A: Absolutely. We welcome entries from around the world.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Q: Do I have to build the physical model?
                </h3>
                <p className="text-white">
                  A: Only if you choose the physical tree category. Digital entries are equally accepted.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Q: What format should I submit digital work in?
                </h3>
                <p className="text-white">
                  A: JPG format is the accepted format for all submissions, other than the optional documents.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Q: Can the tree be of any size?
                </h3>
                <p className="text-white">
                  A: Yes, There are no limitations for the sizes.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-lg p-6">
                <h3 className="text-lg md:text-xl font-bold text-white mb-3">
                  Q: I'm 12 or younger. Can I join?
                </h3>
                <p className="text-white">
                  A: Yes! Submit under the Kids' Category – any format is allowed.
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <p className="text-sm md:text-base text-gray-400 italic text-center">
                Note:-Refer to terms & conditions for all required information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative bg-slate-950/90 py-12 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          {/* Official Partners */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">Official Partners</h3>
            <div className="flex flex-wrap justify-center items-center gap-6">
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
        </div>
      </footer>
    </div>
  )
}
