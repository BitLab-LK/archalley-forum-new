import Image from 'next/image';

export default function TreeWithoutATreePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Section 1: Competition Title */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-6xl md:text-8xl font-bold text-yellow-400 mb-4">
          Tree without a Tree
        </h1>
        <p className="text-xl md:text-2xl text-white mb-2">
          Archalley Competitions 2024
        </p>
        <p className="text-lg md:text-xl text-white mb-8">
          Innovative Christmas Tree "Design, Make & Decorate" Competition
        </p>
        <div className="w-32 h-0.5 bg-white mx-auto"></div>
      </section>

      {/* Section 2: Competition Overview */}
      <section className="py-16 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white uppercase mb-8">
          COMPETITION OVERVIEW
        </h2>
        <h3 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-8">
          Tree without a Tree
        </h3>
        <div className="max-w-4xl mx-auto space-y-6">
          <p className="text-lg md:text-xl text-white">
            was a competition designed to explore alternative solutions for traditional methods of building Christmas trees, beyond the conventional approach.
          </p>
          <p className="text-lg md:text-xl text-white">
            During the Christmas season, we embraced
          </p>
          <p className="text-3xl md:text-4xl font-bold text-yellow-400">
            The spirit of giving
          </p>
          <p className="text-lg md:text-xl text-white">
            by expressing our love and concern for the environment, with an attempt to
          </p>
          <p className="text-3xl md:text-4xl font-bold text-yellow-400">
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
        <p className="text-6xl md:text-8xl font-bold text-yellow-400 mb-8">
          LKR 325,000.00
        </p>
        <p className="text-lg md:text-xl text-white mb-12 max-w-4xl mx-auto">
          3 winning proposals, a special award recipient and 3 honorable mentions were selected. Archalley awarded a total of LKR 325,000.00 in prize money to competition winners as follows:
        </p>
        
        {/* Prize Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Box 1 - 1st Prize */}
          <div className="border border-white p-8 h-48 flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-white mb-4">1st Prize</h3>
            <p className="text-3xl font-bold text-yellow-400">LKR 150,000.00</p>
          </div>
          
          {/* Box 2 - 2nd Prize */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-2">2nd Prize</h3>
            <p className="text-2xl font-bold text-yellow-400">LKR 50,000.00</p>
          </div>
          
          {/* Box 3 - 3rd Prize */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-white mb-2">3rd Prize</h3>
            <p className="text-2xl font-bold text-yellow-400">LKR 25,000.00</p>
          </div>
          
          {/* Box 4 - Most Popular Award */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-white mb-2">Archalley Most Popular Tree Award</h3>
            <p className="text-2xl font-bold text-yellow-400">LKR 100,000.00</p>
          </div>
          
          {/* Box 5 - Special Giveaways */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <p className="text-white mb-2">Special giveaways were awarded for</p>
            <p className="text-xl font-bold text-yellow-400">Sustainable Designs</p>
          </div>
          
          {/* Box 6 - Honorable Mentions */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <p className="text-white mb-2">3 Honorable mentions</p>
            <p className="text-xl font-bold text-yellow-400">Certificate of achievement</p>
          </div>
          
          {/* Box 7 - Finalists */}
          <div className="border border-white p-8 h-32 flex flex-col justify-center">
            <p className="text-white mb-2">10 Finalists</p>
            <p className="text-xl font-bold text-yellow-400">were announced</p>
          </div>
        </div>
      </section>

      {/* Section 4: Contribution */}
      <section className="py-16 px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-white uppercase text-center mb-12">
          CONTRIBUTION
        </h2>
        
        {/* Row 1 */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-lg text-white space-y-4">
              <p>
                We are proud to announce that we have handed over the contribution to SOS Children's Villages as part of the Tree Without a Tree competition. 💚 A heartfelt thank you to all participants and supporters for helping us make a meaningful impact this Christmas. Together, we are fostering creativity, sustainability, and compassion. ✨ Let's continue to inspire positive change—one step at a time.
              </p>
            </div>
            <div className="bg-gray-800 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Donation Event Image</p>
            </div>
          </div>
        </div>
        
        {/* Row 2 */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="bg-gray-800 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Plant Sapling Image</p>
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
        <div className="max-w-6xl mx-auto">
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
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Otara Gunewardene</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Otara Gunewardene</h3>
              <p className="text-sm text-white">DIRECTOR, EMBARK & OTARA FOUNDATION</p>
            </div>
            
            {/* Jury Member 2 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Philip Weeraratne</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Philip Weeraratne</h3>
              <p className="text-sm text-white">FOUNDER & PRINCIPAL ARCHITECT, PWA ARCHITECTS</p>
            </div>
            
            {/* Jury Member 3 */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Ajai Vir Singh</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ajai Vir Singh</h3>
              <p className="text-sm text-white">FOUNDER, CFW, CEYLON LITERARY FESTIVAL, COLLEGE OF FASHION & DESIGN</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Winners */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-16">
            WINNERS
          </h2>
          
          {/* 1st Place Winner */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="bg-gray-800 h-80 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Coconut Shell Tree Image</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">1st Place Winner</h3>
                <p className="text-lg text-white">
                  Congratulations to the Methodist Church Youth – Seeduwa for winning 1st place in the 'Tree Without a Tree' competition 2024! Their tree, crafted from coconut shell pieces, impressed the judges with its creativity and teamwork.
                </p>
              </div>
            </div>
          </div>
          
          {/* 2nd Place Winner */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="bg-gray-800 h-80 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Glass Bottle Tree Image</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">2nd Place Winner</h3>
                <p className="text-lg text-white">
                  Congratulations to Pasindu Kithmina for earning 2nd place in the 'Tree Without a Tree' competition 2024 with his inspiring and thoughtful design!
                </p>
              </div>
            </div>
          </div>
          
          {/* 3rd Place Winner */}
          <div className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="bg-gray-800 h-80 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Painted Pots Tree Image</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">3rd Place Winner</h3>
                <p className="text-lg text-white">
                  Congratulations to KWCA – Kosala Weerasekara Chartered Architects for earning 3rd place in the 'Tree Without a Tree' competition 2024 with their inspiring and out of the box design!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Most Popular Award */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-8">
            MOST POPULAR AWARD
          </h2>
          <p className="text-lg text-white text-center mb-12">
            Congratulations to Rashane Fernando for winning the vote race and earning the title of Most Popular in the 'Tree Without a Tree' competition 2024!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Presentation Slide 1</p>
            </div>
            <div className="bg-gray-800 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Presentation Slide 2</p>
            </div>
            <div className="bg-gray-800 h-64 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Most Popular Tree with Badge</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Special Sustainable Award */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-4">
            SPECIAL SUSTAINABLE AWARD
          </h2>
          <h3 className="text-2xl font-bold text-white uppercase text-center mb-8">
            FROM ACCESS LIFESTYLE
          </h3>
          <p className="text-lg text-white text-center mb-12">
            Congratulations to Ameeda Gunathilaka! Her effort and eco-friendly design is highly appreciated by Access Lifestyle, earning special recognition for their Sustainable Giveaway.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 h-96 rounded-lg flex items-center justify-center">
              <p className="text-gray-400">Sustainable Tree Image</p>
            </div>
            <div className="text-white space-y-4">
              <p className="text-lg">
                This sustainable Christmas tree was crafted using entirely natural and biodegradable materials, showcasing innovative eco-friendly design principles.
              </p>
              <div>
                <h4 className="text-xl font-bold text-yellow-400 mb-4">Materials Used:</h4>
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
        <div className="max-w-6xl mx-auto">
          <div className="w-32 h-0.5 bg-white mx-auto mb-8"></div>
          <h2 className="text-5xl md:text-6xl font-bold text-white uppercase text-center mb-16">
            HONOURABLE MENTIONS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Honourable Mention 1 */}
            <div className="border border-white p-6">
              <div className="bg-gray-800 h-48 rounded-lg mb-4 flex items-center justify-center">
                <p className="text-gray-400">Rashane Fernando Process Image</p>
              </div>
              <p className="text-white">
                A big shoutout to Rashane Fernando for his remarkable entry! His unique vision and creative effort deserve special recognition in the 'Tree Without a Tree' competition 2024.
              </p>
            </div>
            
            {/* Honourable Mention 2 */}
            <div className="border border-white p-6">
              <div className="bg-gray-800 h-48 rounded-lg mb-4 flex items-center justify-center">
                <p className="text-gray-400">BIMA Tree Image</p>
              </div>
              <p className="text-white">
                A big shoutout to BIMA Lanka Insurance Brokers (Pvt) Ltd for their remarkable entry! Their unique vision and creative effort deserve special recognition in the 'Tree Without a Tree' competition 2024.
              </p>
            </div>
            
            {/* Honourable Mention 3 */}
            <div className="border border-white p-6">
              <div className="bg-gray-800 h-48 rounded-lg mb-4 flex items-center justify-center">
                <p className="text-gray-400">Electronic Parts Tree Image</p>
              </div>
              <p className="text-white">
                A big shoutout to Abigail Fernando for her remarkable entry! Her unique vision and creative effort deserve special recognition in the 'Tree Without a Tree' competition 2024.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}