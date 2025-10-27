'use client';

import Link from 'next/link';

export default function InnovativeDesignChallenge2025Page() {
  const handleRegisterClick = () => {
    // Scroll to registration section
    const registrationSection = document.getElementById('registration-section');
    if (registrationSection) {
      registrationSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Floating Registration Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleRegisterClick}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 flex items-center gap-2 animate-pulse"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Register Now
        </button>
      </div>

      {/* Section 1: Competition Title */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-4">
          Innovative Design Challenge
        </h1>
        <p className="text-xl md:text-2xl text-white mb-2">
          Archalley Competitions 2025
        </p>
        <p className="text-lg md:text-xl text-white mb-8">
          Architecture & Design Competition for Sustainable Living
        </p>
        <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <button
            onClick={handleRegisterClick}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-12 rounded-lg transform transition-all duration-300 hover:scale-105 text-lg"
          >
            Register for Competition
          </button>
          <Link
            href="/events"
            className="border-2 border-white hover:bg-white hover:text-black text-white font-bold py-4 px-12 rounded-lg transform transition-all duration-300 hover:scale-105 text-lg"
          >
            Back to Events
          </Link>
        </div>
      </section>

      {/* Section 2: Competition Overview */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white uppercase mb-8">
          COMPETITION OVERVIEW
        </h2>
        <h3 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-8">
          Innovative Design Challenge
        </h3>
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-lg md:text-xl text-white">
            is a competition designed to inspire architects and designers to reimagine sustainable architecture for the modern world.
          </p>
          <p className="text-lg md:text-xl text-white">
            We challenge participants to
          </p>
          <p className="text-3xl md:text-4xl font-bold text-yellow-400">
            Think beyond traditional boundaries
          </p>
          <p className="text-lg md:text-xl text-white">
            by creating innovative, eco-friendly solutions that address contemporary housing challenges with
          </p>
          <p className="text-3xl md:text-4xl font-bold text-yellow-400">
            aesthetic excellence & environmental responsibility,
          </p>
          <p className="text-lg md:text-xl text-white">
            ensuring a sustainable and beautiful future for all.
          </p>
        </div>
      </section>

      {/* Section 3: Awards */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white uppercase mb-8">
          AWARDS
        </h2>
        <p className="text-xl text-white mb-4">Total prize fund</p>
        <p className="text-6xl md:text-8xl font-bold text-yellow-400 mb-8">
          LKR 500,000.00
        </p>
        <p className="text-lg md:text-xl text-white mb-12 max-w-4xl mx-auto">
          3 winning proposals, special award recipients and 3 honorable mentions will be selected. Archalley will award a total of LKR 500,000.00 in prize money to competition winners as follows:
        </p>
        
        {/* Prize Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1 - 1st Prize */}
          <div className="border border-white p-8 h-48 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-white mb-4">1st Prize</h3>
            <p className="text-3xl font-bold text-yellow-400">LKR 200,000.00</p>
          </div>
          
          {/* Box 2 - 2nd Prize */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-2">2nd Prize</h3>
            <p className="text-2xl font-bold text-yellow-400">LKR 100,000.00</p>
          </div>
          
          {/* Box 3 - 3rd Prize */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-2">3rd Prize</h3>
            <p className="text-2xl font-bold text-yellow-400">LKR 50,000.00</p>
          </div>
          
          {/* Box 4 - Innovation Award */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-white mb-2">Best Innovation Award</h3>
            <p className="text-2xl font-bold text-yellow-400">LKR 150,000.00</p>
          </div>
          
          {/* Box 5 - Special Giveaways */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <p className="text-white mb-2">Special giveaways will be awarded for</p>
            <p className="text-xl font-bold text-yellow-400">Sustainable & Green Designs</p>
          </div>
          
          {/* Box 6 - Honorable Mentions */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <p className="text-white mb-2">3 Honorable mentions</p>
            <p className="text-xl font-bold text-yellow-400">Certificate of Excellence</p>
          </div>
          
          {/* Box 7 - Finalists */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <p className="text-white mb-2">15 Finalists</p>
            <p className="text-xl font-bold text-yellow-400">will be announced</p>
          </div>
        </div>
      </section>

      {/* Section 4: Competition Brief */}
      <section className="py-16 px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-white uppercase text-center mb-12">
          COMPETITION BRIEF
        </h2>
        
        {/* Row 1 */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-lg text-white space-y-4">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Challenge Theme</h3>
              <p>
                Design a sustainable living space that seamlessly integrates with its environment while maximizing energy efficiency and minimizing ecological footprint. Your design should address modern urban challenges including space optimization, resource management, and community integration.
              </p>
              <p>
                Participants are encouraged to explore innovative materials, renewable energy solutions, and biophilic design principles to create spaces that enhance both human well-being and environmental sustainability.
              </p>
            </div>
            <div className="bg-gray-800 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Sustainable Architecture Concept</p>
            </div>
          </div>
        </div>
        
        {/* Row 2 */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="bg-gray-800 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Design Requirements Visual</p>
            </div>
            <div className="text-lg text-white space-y-4">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Key Requirements</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Incorporate at least 3 sustainable design features</li>
                <li>Demonstrate innovative use of materials</li>
                <li>Include renewable energy integration</li>
                <li>Show consideration for local climate and context</li>
                <li>Present scalable and adaptable solutions</li>
                <li>Address social and community needs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Timeline */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase text-center mb-12">
            COMPETITION TIMELINE
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phase 1 */}
            <div className="border border-white p-6 text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-4">01</div>
              <h3 className="text-xl font-bold text-white mb-3">Registration Opens</h3>
              <p className="text-white">March 15, 2025</p>
            </div>
            
            {/* Phase 2 */}
            <div className="border border-white p-6 text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-4">02</div>
              <h3 className="text-xl font-bold text-white mb-3">Submission Deadline</h3>
              <p className="text-white">June 30, 2025</p>
            </div>
            
            {/* Phase 3 */}
            <div className="border border-white p-6 text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-4">03</div>
              <h3 className="text-xl font-bold text-white mb-3">Jury Evaluation</h3>
              <p className="text-white">July 1-31, 2025</p>
            </div>
            
            {/* Phase 4 */}
            <div className="border border-white p-6 text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-4">04</div>
              <h3 className="text-xl font-bold text-white mb-3">Winners Announced</h3>
              <p className="text-white">August 15, 2025</p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="registration-section" className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="w-32 h-0.5 bg-yellow-400 mx-auto mb-8"></div>
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase text-center mb-6">
            REGISTER NOW
          </h2>
          <p className="text-xl text-white text-center mb-12">
            Join us in shaping the future of sustainable architecture
          </p>
          
          <div className="bg-black border-2 border-yellow-400 rounded-2xl p-8 md:p-12 shadow-2xl">
            {/* Registration Details */}
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Registration Fee</h3>
                  <p className="text-gray-300">LKR 5,000 per entry (Early bird discount available)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Eligibility</h3>
                  <p className="text-gray-300">Open to architecture students, professionals, and design enthusiasts worldwide</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Team Participation</h3>
                  <p className="text-gray-300">Individual or team entries (max 4 members per team)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Registration Deadline</h3>
                  <p className="text-gray-300">June 15, 2025 (2 weeks before submission deadline)</p>
                </div>
              </div>
            </div>
            
            {/* Registration Form Preview / Button */}
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">
                How to Register
              </h3>
              <ol className="space-y-3 text-white mb-6">
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-400 text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">1</span>
                  <span>Click the registration button below</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-400 text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">2</span>
                  <span>Fill in your details and team information</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-400 text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">3</span>
                  <span>Complete the payment process</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-yellow-400 text-black font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">4</span>
                  <span>Receive confirmation email with competition guidelines</span>
                </li>
              </ol>
            </div>
            
            {/* Main Registration Button */}
            <div className="text-center">
              <button
                onClick={() => alert('Registration form will be integrated here. This will connect to your registration system.')}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-5 px-16 rounded-xl text-xl transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-2xl"
              >
                Complete Registration
              </button>
              <p className="text-gray-400 text-sm mt-4">
                Questions? Contact us at <a href="mailto:competitions@archalley.com" className="text-yellow-400 hover:underline">competitions@archalley.com</a>
              </p>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="text-yellow-400 text-3xl mb-3">📋</div>
              <h4 className="text-white font-bold mb-2">Competition Brief</h4>
              <p className="text-gray-400 text-sm">Download detailed guidelines after registration</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="text-yellow-400 text-3xl mb-3">💬</div>
              <h4 className="text-white font-bold mb-2">Q&A Sessions</h4>
              <p className="text-gray-400 text-sm">Monthly webinars for registered participants</p>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
              <div className="text-yellow-400 text-3xl mb-3">🎓</div>
              <h4 className="text-white font-bold mb-2">Mentorship</h4>
              <p className="text-gray-400 text-sm">Access to expert guidance and resources</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Jury Panel */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase text-center mb-8">
            JURY PANEL
          </h2>
          <p className="text-lg text-white text-center mb-12">
            Our distinguished panel of experts will evaluate all submissions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Jury Member 1 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Expert 1</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">To Be Announced</h3>
              <p className="text-sm text-white">PRINCIPAL ARCHITECT</p>
            </div>
            
            {/* Jury Member 2 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Expert 2</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">To Be Announced</h3>
              <p className="text-sm text-white">SUSTAINABLE DESIGN SPECIALIST</p>
            </div>
            
            {/* Jury Member 3 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Expert 3</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">To Be Announced</h3>
              <p className="text-sm text-white">URBAN PLANNING EXPERT</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Submission Requirements */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-16">
            SUBMISSION REQUIREMENTS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Requirement 1 */}
            <div className="border border-white p-8">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Design Boards</h3>
              <p className="text-lg text-white mb-4">
                Submit 3-5 A1 size boards (landscape or portrait) showcasing:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Site context and analysis</li>
                <li>Concept development</li>
                <li>Floor plans and sections</li>
                <li>3D renderings/visualizations</li>
                <li>Sustainability strategies</li>
              </ul>
            </div>
            
            {/* Requirement 2 */}
            <div className="border border-white p-8">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Technical Drawings</h3>
              <p className="text-lg text-white mb-4">
                Include detailed technical documentation:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Architectural drawings (plans, elevations, sections)</li>
                <li>Material specifications</li>
                <li>Energy analysis reports</li>
                <li>Structural diagrams</li>
                <li>Construction details</li>
              </ul>
            </div>
            
            {/* Requirement 3 */}
            <div className="border border-white p-8">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Design Statement</h3>
              <p className="text-lg text-white mb-4">
                Provide a written document (max 1000 words) explaining:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Design concept and philosophy</li>
                <li>Sustainability approach</li>
                <li>Material selection rationale</li>
                <li>Innovation highlights</li>
                <li>Social and environmental impact</li>
              </ul>
            </div>
            
            {/* Requirement 4 */}
            <div className="border border-white p-8">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">Digital Submission</h3>
              <p className="text-lg text-white mb-4">
                Submit all materials digitally in the following format:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Boards: PDF format (max 20MB each)</li>
                <li>Technical drawings: DWG or PDF</li>
                <li>Statement: PDF format</li>
                <li>Images: JPEG/PNG (high resolution)</li>
                <li>Optional: Video walkthrough (max 3 min)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Eligibility */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-12">
            ELIGIBILITY
          </h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="border border-white p-8 mb-8">
              <h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Who Can Participate?</h3>
              <div className="space-y-4 text-lg text-white">
                <p>✓ Professional architects and designers</p>
                <p>✓ Architecture and design students</p>
                <p>✓ Interdisciplinary teams</p>
                <p>✓ Individual participants or groups (max 4 members)</p>
                <p>✓ International participants welcome</p>
              </div>
            </div>
            
            <div className="border border-white p-8">
              <h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Registration Fee</h3>
              <div className="text-center">
                <p className="text-lg text-white mb-4">Students: LKR 2,000</p>
                <p className="text-lg text-white mb-4">Professionals: LKR 5,000</p>
                <p className="text-lg text-white">Teams: LKR 8,000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: How to Participate */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-16">
            HOW TO PARTICIPATE
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="border border-white p-6">
              <div className="text-6xl font-bold text-yellow-400 mb-4 text-center">01</div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Register Online</h3>
              <p className="text-white text-center">
                Visit our website and complete the registration form. Pay the registration fee to confirm your participation.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="border border-white p-6">
              <div className="text-6xl font-bold text-yellow-400 mb-4 text-center">02</div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Develop Your Design</h3>
              <p className="text-white text-center">
                Work on your innovative design solution following the competition brief and submission requirements.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="border border-white p-6">
              <div className="text-6xl font-bold text-yellow-400 mb-4 text-center">03</div>
              <h3 className="text-xl font-bold text-white mb-4 text-center">Submit Your Entry</h3>
              <p className="text-white text-center">
                Upload all required materials through our submission portal before the deadline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: Contact & Questions */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase mb-8">
            QUESTIONS?
          </h2>
          <p className="text-lg text-white mb-8">
            For any inquiries about the competition, please contact us:
          </p>
          <div className="space-y-4 text-white">
            <p className="text-xl">📧 Email: competitions@archalley.com</p>
            <p className="text-xl">📱 WhatsApp: +94 XX XXX XXXX</p>
            <p className="text-xl">🌐 Website: www.archalley.com</p>
          </div>
          <div className="mt-12">
            <button className="bg-yellow-400 text-black px-8 py-4 rounded-full text-lg font-bold hover:bg-yellow-300 transition-colors">
              Register Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
