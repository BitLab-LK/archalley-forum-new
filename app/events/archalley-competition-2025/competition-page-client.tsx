"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { event } from "@/lib/google-analytics"

export default function CompetitionPageClient() {
  const [isSticky, setIsSticky] = useState(false)
  const [navHeight, setNavHeight] = useState(0)
  const navRef = useRef<HTMLElement>(null)
  const [timelineProgress, setTimelineProgress] = useState(0)
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const [activeMobileTab, setActiveMobileTab] = useState('challenge')

  // Function to handle tab change and scroll to respective section
  const handleTabChange = (tab: string) => {
    setActiveMobileTab(tab)
    
    // Scroll to the respective section based on tab
    setTimeout(() => {
      let targetSection = ''
      if (tab === 'challenge') {
        targetSection = '#theme'
      } else if (tab === 'awards') {
        targetSection = '#awards'
      } else if (tab === 'jury') {
        targetSection = '#jury-panel'
      }
      
      if (targetSection) {
        const element = document.querySelector(targetSection)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }, 100)
  }

  // Calculate timeline progress
  useEffect(() => {
    const calculateProgress = () => {
      const startDate = new Date('2025-11-11').getTime()
      const endDate = new Date('2025-12-24').getTime()
      const currentDate = new Date().getTime()
      
      const totalDuration = endDate - startDate
      const elapsed = currentDate - startDate
      const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)
      
      setTimelineProgress(progress)
    }

    calculateProgress()
    const interval = setInterval(calculateProgress, 1000 * 60 * 60) // Update every hour
    
    return () => clearInterval(interval)
  }, [])

  // Track competition page view
  useEffect(() => {
    event({
      action: 'view_competition',
      category: 'competition',
      label: 'archalley_competition_2025',
    });
  }, []);

  // Prevent body scroll when popup is open
  useEffect(() => {
    if (activePopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activePopup]);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('section:first-of-type')
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom
        setIsSticky(heroBottom <= 0)
      }
    }

    const updateNavHeight = () => {
      if (navRef.current) {
        setNavHeight(navRef.current.offsetHeight)
      }
    }

    updateNavHeight()
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', updateNavHeight)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updateNavHeight)
    }
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    const targetElement = document.getElementById(targetId)
    
    if (!targetElement) {
      console.warn(`Element with id "${targetId}" not found`)
      return
    }
    
    const currentNavHeight = navRef.current?.offsetHeight || 0
    const heroSection = document.querySelector('section:first-of-type')
    const isNavSticky = heroSection ? heroSection.getBoundingClientRect().bottom <= 0 : false
    
    // Calculate the absolute position of the element
    let elementTop = 0
    let currentElement: HTMLElement | null = targetElement
    
    while (currentElement) {
      elementTop += currentElement.offsetTop
      currentElement = currentElement.offsetParent as HTMLElement | null
    }
    
    // Account for sticky navbar
    const scrollPosition = elementTop - (isNavSticky ? currentNavHeight : 0)
    
    window.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth'
    })
  }

  const navLinks = [
    { href: '#theme', label: 'Theme' },
    { href: '#submission-categories', label: 'Categories' },
    { href: '#how-to-join', label: 'How to Join' },
    { href: '#awards', label: 'Awards' },
    { href: '#timeline', label: 'Timeline' },
    { href: '#jury-panel', label: 'Jury' },
  ]

  return (
    <div className="competition-page-2025 min-h-screen bg-slate-900 text-gray-200 scroll-smooth relative">
      {/* Global style to ensure all elements have sharp borders, except circular profile pictures */}
      <style dangerouslySetInnerHTML={{__html: `
        .competition-page-2025 * {
          border-radius: 0 !important;
        }
        .competition-page-2025 .rounded-full {
          border-radius: 9999px !important;
        }
      `}} />
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

      {/* Hero Section - Transparent with blue overlay to reveal fixed bg */}
      <section id="introduction" className="relative w-full z-30">
          <div className="relative w-full min-h-[600px] md:h-[700px] lg:h-[800px]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/30 via-slate-900/60 to-slate-900/30" />
          <div className="absolute inset-0 flex items-center justify-center px-4 py-6 md:px-6 md:py-0 lg:px-8">
            <div className="container mx-auto flex flex-col items-center text-center space-y-2 md:space-y-6 lg:space-y-8 -mt-32 md:-mt-40 lg:-mt-48">
              <style>{`
                @media (max-width: 767px) {
                  .christmas-word,
                  .in-word {
                    -webkit-box-reflect: below -12px linear-gradient(transparent 0%, transparent 60%, rgba(255, 255, 255, 0.75) 100%) !important;
                  }
                  .future-word {
                    -webkit-box-reflect: below -10px linear-gradient(transparent 0%, transparent 65%, rgba(255, 255, 255, 0.75) 100%) !important;
                  }
                }
              `}</style>
              <h1 className="font-aquire uppercase mb-4 md:mb-8">
                <span className="block">
                  <span
                    className="christmas-word inline-block text-4xl md:text-7xl lg:text-8xl bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #C00000 0%, #6A4A60 33%, #95B3D7 66%, #376092 100%)',
                      WebkitBoxReflect: 'below -15px linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(255, 255, 255, 0.5) 100%)'
                    }}
                  >
                    CHRISTMAS
                  </span>
                  {' '}
                  <span
                    className="in-word inline-block text-4xl md:text-7xl lg:text-8xl bg-clip-text text-transparent md:px-4 lg:px-6"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #C00000 0%, #6A4A60 33%, #95B3D7 66%, #376092 100%)',
                      WebkitBoxReflect: 'below -15px linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(255, 255, 255, 0.5) 100%)'
                    }}
                  >
                    IN
                  </span>
                  {' '}
                  <span
                    className="future-word inline-block text-5xl md:text-7xl lg:text-8xl bg-clip-text text-transparent"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #C00000 0%, #6A4A60 33%, #95B3D7 66%, #376092 100%)',
                      WebkitBoxReflect: 'below -15px linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(255, 255, 255, 0.5) 100%)'
                    }}
                  >
                    FUTURE
                  </span>
                </span>
              </h1>
              <div className="text-base md:text-2xl lg:text-3xl text-gray-300 leading-[20px] md:leading-normal mt-56 pt-12 md:mt-0 md:pt-0">
                <p className="mb-0 md:mb-0">Innovative Christmas Tree Competition 2025</p>
                <p className="mb-1 md:mb-2 font-light">Edition #2</p>
                <p className="mb-1 md:mb-2">TOTAL PRICE - LKR 500,000.00</p>
              </div>

              {/* Live Timeline */}
              <div className="w-full max-w-3xl mx-auto px-4 mb-4 md:mb-6">
                <div className="bg-transparent p-2 md:p-4">
                  {/* Date Labels */}
                  <div className="relative mb-3">
                    <div className="absolute left-0 text-left">
                      <p className="text-[10px] md:text-sm text-gray-400">Nov 11</p>
                    </div>
                    <div 
                      className="absolute text-center"
                      style={{ 
                        left: `${Math.max(25, Math.min(timelineProgress, 75))}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      <p className="text-[10px] md:text-sm font-medium text-white bg-slate-900/50 px-1 rounded">
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="absolute right-0 text-right">
                      <p className="text-[10px] md:text-sm text-gray-400">Dec 24</p>
                    </div>
                    <div style={{ height: '20px' }}></div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative w-full h-1 bg-gray-700">
                    <div 
                      className="absolute left-0 top-0 h-full bg-white transition-all duration-1000"
                      style={{ width: `${timelineProgress}%` }}
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white"
                      style={{ left: `calc(${timelineProgress}% - 6px)` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-2 md:mb-4 mt-16 md:mt-8">
              <Button
                asChild
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
              >
                <Link href="/events/archalley-competition-2025/register">
                  Register Now
                </Link>
              </Button>
              <Button
                asChild
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
              >
                <a 
                  href="/downloads/Christmas Tree Competition 2025 - Brief.pdf"
                  download="Christmas Tree Competition 2025 - Brief.pdf"
                >
                  Download Brief
                </a>
              </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Bar - Hidden on mobile */}
      <div className="relative mt-4 md:mt-12 lg:mt-0 hidden md:block">
        <nav 
          ref={navRef}
          className={`w-full bg-white/80 text-black z-50 transition-all duration-300 ${
            isSticky ? 'fixed top-0 shadow-lg' : 'relative'
          }`}
        >
          <div className="w-full px-4 md:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3 md:gap-4 lg:gap-6 py-3 md:py-4 overflow-x-auto">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)} 
                  className="text-base font-medium text-black hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </nav>
        {/* Placeholder to prevent content shift when navbar becomes fixed */}
        {isSticky && navHeight > 0 && <div style={{ height: `${navHeight}px` }} />}
      </div>

      {/* Mobile Tabs - Only visible on mobile */}
      <div className="md:hidden bg-slate-900 sticky top-0 z-40 border-b border-gray-600">
        <div className="flex">
          <button
            onClick={() => handleTabChange('challenge')}
            className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
              activeMobileTab === 'challenge'
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Challenge
            {activeMobileTab === 'challenge' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => handleTabChange('awards')}
            className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
              activeMobileTab === 'awards'
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Awards
            {activeMobileTab === 'awards' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            onClick={() => handleTabChange('jury')}
            className={`flex-1 py-4 px-4 text-center font-medium transition-colors relative ${
              activeMobileTab === 'jury'
                ? 'text-white'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Jury
            {activeMobileTab === 'jury' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
        </div>
      </div>

      {/* Desktop: Show all sections normally, Mobile: Show based on active tab */}
      <div className="md:block">
        {/* Challenge Content - Always visible on desktop, conditionally on mobile */}
        <div className={`md:block ${activeMobileTab === 'challenge' ? 'block' : 'hidden'}`}>
          {/* Theme Section */}
      <section id="theme" className="relative py-12 md:py-12 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-4xl mx-auto">
            <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-500 uppercase tracking-widest text-center mb-6 md:mb-8">
              Challenge
            </p>
            <h2 id="theme" className="text-2xl md:text-4xl font-bold text-white mb-6 uppercase tracking-wide text-center scroll-mt-20">
              <a href="#theme">A THEME THAT REIMAGINES TRADITION</a>
            </h2>
            <div className="text-base text-center mb-6 leading-6">
              <span className="text-red-500">
                What will a Christmas tree look like in<br />
              </span>
              <span className="text-red-500 text-xl font-bold">
                50 years?
              </span>
            </div>
            <div className="text-base text-gray-300 text-center mb-6 leading-6">
              Will it float, glow, or live in the metaverse? This year's<br />
              competition invites you to imagine the "tree of tomorrow."
            </div>
            
            <div className="mb-6"></div>
            
            <div className="text-base text-gray-300 text-center mb-6 leading-6">
              Participants are encouraged to explore<br />
              <span className="text-red-500">unconventional, futuristic, and conceptual interpretations,</span><br />
              from virtual models to physical tree designs.
            </div>
            
            <div className="mb-6"></div>
            
            <div className="text-base text-gray-300 text-center leading-6">
              Your tree can be<br />
              either minimal or detailed, digital, tech-infused, or<br />
              completely surreal.<br />
              There are no rules... Only imagination.
            </div>
            
            <div className="mb-8"></div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                asChild
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
              >
                <Link href="/events/archalley-competition-2025/register">
                  Register Now
                </Link>
              </Button>
              <Button
                asChild
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
              >
                <a 
                  href="/downloads/Christmas Tree Competition 2025 - Brief.pdf"
                  download="Christmas Tree Competition 2025 - Brief.pdf"
                >
                  Download Brief
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Submission Categories & Who Can Join */}
      <section className="relative min-h-[600px] z-20 overflow-hidden">
        {/* Content - Constrained to default width */}
        <div className="relative z-10 min-h-[600px] flex items-center px-4 md:px-6 lg:px-8 pt-12 md:pt-12 pb-12 md:pb-12">
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center">
              <h2 id="submission-categories" className="text-2xl md:text-4xl font-bold text-white mb-8 uppercase tracking-wide scroll-mt-20">
                <a href="#submission-categories">SUBMISSION CATEGORIES</a>
              </h2>
              
              <div className="space-y-4 max-w-3xl mx-auto text-left">
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 text-base md:text-xl leading-[20px] md:leading-normal font-bold flex-1 text-left">• Physical Tree Category</span>
                  <Button
                    onClick={() => setActivePopup('physical')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded-none whitespace-nowrap"
                  >
                    Click for more
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 text-base md:text-xl leading-[20px] md:leading-normal font-bold flex-1 text-left">• Digital Tree Category</span>
                  <Button
                    onClick={() => setActivePopup('digital')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded-none whitespace-nowrap"
                  >
                    Click for more
                  </Button>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 text-base md:text-xl leading-[20px] md:leading-normal font-bold flex-1 text-left">• Kid's Tree Category (Age under 12)</span>
                  <Button
                    onClick={() => setActivePopup('kids')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm rounded-none whitespace-nowrap"
                  >
                    Click for more
                  </Button>
                </div>
              </div>

              {/* Category Information Popups */}
              {activePopup && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 py-8 md:py-4 overflow-y-auto" onClick={() => setActivePopup(null)}>
                  <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-600 max-w-4xl w-full max-h-[80vh] md:max-h-[90vh] overflow-y-auto relative my-auto" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Close Button */}
                    <button 
                      onClick={() => setActivePopup(null)} 
                      className="sticky top-2 right-2 z-10 text-gray-400 hover:text-white text-2xl font-light bg-black/50 w-8 h-8 flex items-center justify-center hover:bg-black/70 transition-colors rounded-full ml-auto mr-2"
                    >
                      ×
                    </button>

                    {/* Header Section */}
                    <div className="relative p-8 pb-6">
                      {/* Background decoration similar to PDF */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-transparent"></div>
                      </div>
                      
                      <div className="relative">
                        <p className="text-right text-gray-400 text-sm italic mb-2">Archalley Competition 2025</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-white text-center underline decoration-2 underline-offset-4 mb-6 tracking-wide">
                          {activePopup === 'physical' && 'PHYSICAL TREE CATEGORY'}
                          {activePopup === 'digital' && 'DIGITAL TREE CATEGORY'}
                          {activePopup === 'kids' && "KIDS' TREE CATEGORY"}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="px-8 pb-8">
                      <div className="text-gray-200 space-y-4 text-base leading-relaxed">
                        {activePopup === 'physical' && (
                          <>
                            <div className="flex flex-col space-y-3 text-left">
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Build it for real:</strong> The tree must be a physically made product (in 2D or 3D form) and photographed for submission.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Real photos only:</strong> Upload actual photographs of the built tree. Post-processing is limited to basic global color/exposure correction and cropping.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Strictly no AI or graphic edits:</strong> AI-generated/AI-modified images, graphically enhances, compositing, retouching, or graphic enhancements are <strong className="text-red-400">not permitted</strong> and may lead to disqualification.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left">Graphical representations using 3D modeling software, 3D renders, Drawings, printed graphics will <strong className="text-red-400">not be accepted</strong> as the product under this category.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Physical Tree Category - Accepted Formats:</strong> Sewing / Fabric crafts, Sculptures, Crafted trees / Tree models</span>
                              </p>
                            </div>
                          </>
                        )}
                        
                        {activePopup === 'digital' && (
                          <>
                            <div className="flex flex-col space-y-3 text-left">
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Digital Tree Category - Accepted Formats:</strong> Paintings, drawings, digital illustrations, mixed media, AI-generated or AI-enhanced images, 3D-rendered images, and graphical representations created using 3D modeling software.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Originality & rights:</strong> The entry must be your original work or use assets you are legally licensed to use. Do not include copyrighted logos/characters or third-party assets without written permission. You are responsible for all rights and clearances.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">AI usage disclosure:</strong> AI-assisted work is allowed. By submitting, you <strong className="text-blue-400">warrant</strong> that no third-party rights are infringed and that any model/assets/prompts used are permitted for this purpose.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Compliance:</strong> Entries that breach these terms or the general competition rules may be <strong className="text-red-400">disqualified</strong>.</span>
                              </p>
                            </div>
                          </>
                        )}
                        
                        {activePopup === 'kids' && (
                          <>
                            <div className="flex flex-col space-y-3 text-left">
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">No winners selected:</strong> This category will <strong className="text-red-400">not</strong> be judged by the jury and is <strong className="text-red-400">not eligible</strong> for popularity voting or prizes.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Participation recognition:</strong> Each <strong className="text-green-400">completed submission</strong> receives one gift and a <strong className="text-green-400">certificate of participation</strong>.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Single entry policy:</strong> Only one (1) entry per participant is permitted.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">No group entries:</strong> Group/team entries are <strong className="text-red-400">not allowed</strong> in the Kids' Category.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Parent/Guardian responsibility:</strong> The parent/guardian is responsible for entering the child's accurate details, submission, and <strong className="text-yellow-400">delivery address</strong>, including a <strong className="text-yellow-400">valid phone number</strong>.</span>
                              </p>
                              <p className="flex items-start gap-3 text-left">
                                <span className="text-white font-bold min-w-fit">•</span> 
                                <span className="text-left"><strong className="text-white">Delivery address required:</strong> A correct, complete delivery address and phone number are <strong className="text-yellow-400">mandatory</strong>. Archalley is <strong className="text-red-400">not liable</strong> for non-delivery, delays, misplacement, or damage arising from incorrect/incomplete details or third-party courier issues.</span>
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Footer with vertical line */}
                      <div className="mt-8 pt-6 border-t border-slate-600">
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
        </div>

        {/* Awards Content - Only visible on Awards tab (mobile) or always on desktop */}
        <div className={`md:block ${activeMobileTab === 'awards' ? 'block' : 'hidden'}`}>
          {/* Awards Section */}
      <section className="relative py-12 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-800/50 z-20">
        <div className="max-w-7xl mx-auto relative">
          {/* Top Section */}
          <div className="text-center mb-12">
            <h2 id="awards" className="text-2xl md:text-4xl font-bold text-white mb-4 uppercase tracking-wide scroll-mt-20">
              <a href="#awards" >AWARDS</a>
          </h2>
            <p className="text-base md:text-xl text-gray-300 mb-2 leading-[20px] md:leading-normal">
              Total prize fund more than
            </p>
            <p className="text-4xl md:text-5xl font-bold text-red-500 mb-4">
              LKR 500,000.00
            </p>
            <p className="text-base md:text-lg text-gray-300 max-w-4xl mx-auto leading-[20px] md:leading-normal">
              Archalley will award a total of LKR 325,000.00 in prize money to competition winners as follows:
          </p>
        </div>

          {/* Main Prize Categories - Two Columns with Equal Height */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-stretch">
            {/* Physical Category - Left Box */}
            <div className="rounded-none flex flex-col h-full">
              <h3 className="text-base md:text-2xl font-bold text-white mb-6 uppercase text-center">
                PHYSICAL CATEGORY
              </h3>
              <div className="space-y-3 flex-1 flex flex-col gap-2">
                <div className="bg-red-900/80 p-6 text-center">
                  <p className="text-white mb-2 text-base leading-[20px]">1st Prize</p>
                  <p className="text-2xl md:text-4xl font-bold text-white">LKR 150,000.00</p>
                </div>
                <div className="bg-red-900/80 p-6 text-center">
                  <p className="text-white mb-2 text-base leading-[20px]">2nd Prize</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">LKR 50,000.00</p>
                </div>
                <div className="bg-red-900/80 p-6 text-center flex-1 flex flex-col justify-center">
                  <p className="text-white mb-2 text-base leading-[20px]">3rd Prize</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">LKR 25,000</p>
                </div>
              </div>
            </div>

            {/* Digital Category - Right Box */}
            <div className="rounded-none flex flex-col h-full">
              <h3 className="text-base md:text-2xl font-bold text-white mb-6 uppercase text-center">
                DIGITAL CATEGORY
            </h3>
              <div className="flex-1 flex flex-col gap-4">
                <div className="bg-red-900/80 p-6 text-center flex-1 flex flex-col justify-center">
                  <p className="text-white mb-2 text-base leading-[20px]">1st Prize</p>
                  <p className="text-2xl md:text-4xl font-bold text-white">TABLET</p>
                </div>
                <div className="bg-red-900/80 p-6 text-center flex-1 flex flex-col justify-center">
                  <p className="text-white mb-2 text-base leading-[20px]">2nd Prize</p>
                  <p className="text-2xl md:text-3xl font-bold text-white">DRAWING PAD</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Awards - Bottom Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-stretch">
            {/* Archalley Most Popular Tree Award */}
            <div className="bg-red-900/80 p-6 text-center flex flex-col justify-center">
              <p className="text-white mb-4 text-base md:text-xl font-semibold leading-[20px] md:leading-normal">Archalley Most Popular Tree Award</p>
              <p className="text-2xl md:text-4xl font-bold text-white">LKR 100,000.00</p>
            </div>

            {/* Kids' Category */}
            <div className="bg-red-900/80 p-6 text-center flex flex-col justify-center">
              <p className="text-white mb-3 text-base md:text-xl font-semibold leading-[20px] md:leading-normal">Kids' category</p>
              <p className="text-white mb-2 text-xl leading-[20px]">A Gift per each Submission</p>
              <p className="text-white text-base leading-[20px] md:leading-normal">Certificate of participation</p>
            </div>

            {/* Honorable Mentions & Finalists - Two Stacked Blocks */}
            <div className="flex flex-col gap-3 h-full">
              <div className="bg-red-900/80 p-6 text-center flex-1 flex flex-col justify-center">
                <p className="text-white mb-2 text-base md:text-xl font-semibold leading-[20px] md:leading-normal">3 Honorable mentions</p>
                <p className="text-white text-xl leading-[20px] md:leading-normal">Certificate of achievement</p>
              </div>
              <div className="bg-red-900/80 p-6 text-center flex-1 flex flex-col justify-center">
                <p className="text-white mb-2 text-base md:text-xl font-semibold leading-[20px] md:leading-normal">10 Finalists</p>
                <p className="text-white text-xl leading-[1.5] md:leading-normal">From Each Category will be announced</p>
              </div>
            </div>
          </div>

          {/* Notes and Footer */}
          <div className="space-y-6 text-gray-300 text-base md:text-lg leading-[20px] md:leading-normal max-w-4xl mx-auto text-center">
            <p className="text-white font-semibold">All participants will get a certificate</p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                asChild
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
              >
                <Link href="/events/archalley-competition-2025/register">
                  Register Now
                </Link>
              </Button>
              <Button
                asChild
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
              >
                <a 
                  href="/downloads/Christmas Tree Competition 2025 - Brief.pdf"
                  download="Christmas Tree Competition 2025 - Brief.pdf"
                >
                  Download Brief
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
        </div>

        {/* Jury Content - Only visible on Jury tab (mobile) or always on desktop */}
        <div className={`md:block ${activeMobileTab === 'jury' ? 'block' : 'hidden'}`}>
          {/* Jury Section */}
      <section className="relative py-12 md:py-12 px-4 md:px-6 lg:px-8 bg-slate-800/50 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 id="jury-panel" className="text-2xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#jury-panel">JURY PANEL</a>
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
              <div key={index} className="bg-slate-800/70 rounded-none p-6 text-center">
                <div className={`relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 overflow-hidden ${index < 4 ? 'rounded-full' : 'rounded-none'}`}>
                  <Image
                    src={jury.image}
                    alt={jury.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <h3 className="text-[14.4px] md:text-lg font-bold text-white mb-2 leading-[20px] md:leading-normal">{jury.name}</h3>
                <div className="text-[11.2px] md:text-sm space-y-1 leading-[20px] md:leading-normal" style={{ color: '#FFA000' }}>
                  {jury.bio.map((line, bioIndex) => (
                    <p key={bioIndex}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Alley - Centered Banner Row */}
          <div className="flex justify-center">
            <div className="bg-slate-800/70 rounded-none p-6 text-center w-full md:max-w-[calc(50%-0.75rem)] lg:max-w-[calc((1280px-3*1.5rem)/2+1.5rem)]">
              <div className="relative w-full h-24 md:h-40 mx-auto mb-4 rounded-none overflow-hidden">
                <Image
                  src="/uploads/alley-juror-2.webp"
                  alt="Alley"
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="text-[14.4px] md:text-lg font-bold text-white mb-2 leading-[20px] md:leading-normal">Alley</h3>
              <div className="text-[11.2px] md:text-sm space-y-1 leading-[20px] md:leading-normal" style={{ color: '#FFA000' }}>
                <p>Non Biological Juror</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-24 md:mt-12">
            <Button
              asChild
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
            >
              <Link href="/events/archalley-competition-2025/register">
                Register Now
              </Link>
            </Button>
            <Button
              asChild
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
            >
              <a 
                href="/downloads/Christmas Tree Competition 2025 - Brief.pdf"
                download="Christmas Tree Competition 2025 - Brief.pdf"
              >
                Download Brief
              </a>
            </Button>
          </div>
        </div>
      </section>
        </div>

        {/* Shared Sections - Timeline + How to Join + FAQ + Contact + Partners + Footer */}
        <div className="md:block block">

      {/* Timeline Section */}
      <section className="relative py-12 md:py-12 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 id="timeline" className="text-2xl md:text-4xl font-bold text-white mb-12 uppercase tracking-wide text-center scroll-mt-20">
            <a href="#timeline">TIMELINE</a>
          </h2>
          
          <div className="space-y-3">
            {/* Registration Phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1 - Section Heading (only for first row) */}
              <div className="flex items-center md:col-span-1 col-span-1">
                <h3 className="text-base md:text-2xl font-bold text-red-500 uppercase">Registration</h3>
              </div>
              {/* Columns 2 & 3 - Event Description and Date (inline on mobile) */}
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Competition Registration starts</span>
                </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">11<sup>th</sup> November</span>
                </div>
              </div>
            </div>

            {/* Registration - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex items-center">
                {/* Empty for section heading column on desktop */}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Early bird registration</span>
                </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">11<sup>th</sup> November -20<sup>th</sup> November</span>
                </div>
              </div>
            </div>

            {/* Registration - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex items-center">
                {/* Empty for section heading column on desktop */}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Standard registration</span>
                </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">21<sup>st</sup> November -20<sup>th</sup> December</span>
                </div>
              </div>
            </div>

            {/* Registration - Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex items-center">
                {/* Empty for section heading column on desktop */}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Late Registration</span>
                </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">21<sup>st</sup> December -24<sup>th</sup> December</span>
                </div>
              </div>
            </div>

            <hr className="my-6" />

            {/* Submissions Phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1 - Section Heading (only for first row) */}
              <div className="flex items-center md:col-span-1 col-span-1">
                <h3 className="text-base md:text-2xl font-bold text-red-500 uppercase">Submissions</h3>
              </div>
              {/* Columns 2 & 3 - Event Description and Date (inline on mobile) */}
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Submission Start</span>
                </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">11<sup>th</sup> December</span>
                </div>
              </div>
            </div>

            {/* Submissions - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex items-center">
                {/* Empty for section heading column on desktop */}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Closing Date for FAQ</span>
                </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">20<sup>th</sup> December</span>
                </div>
              </div>
            </div>

            {/* Submissions - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex items-center">
                {/* Empty for section heading column on desktop */}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Submission Deadline for Kids' Category</span>
                  </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">21<sup>st</sup> December</span>
                  </div>
                </div>
                </div>

            {/* Submissions - Row 4 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex items-center">
                {/* Empty for section heading column on desktop */}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Submission Deadline for other categories</span>
                  </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">24<sup>th</sup> December</span>
                  </div>
                </div>
                </div>

            <hr className="my-6" />

            {/* Voting & Results Phase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1 - Section Heading (only for first row) */}
              <div className="flex items-center md:col-span-1 col-span-1">
                <h3 className="text-base md:text-2xl font-bold text-red-500 uppercase">Voting & Results</h3>
              </div>
              {/* Columns 2 & 3 - Event Description and Date (inline on mobile) */}
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Most popular category voting</span>
                  </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">25<sup>th</sup> December to 4<sup>th</sup> January</span>
                  </div>
                </div>
                </div>

            {/* Voting & Results - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="hidden md:flex items-center">
                {/* Empty for section heading column on desktop */}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-2">
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white text-[11.2px] md:text-base leading-[20px] md:leading-normal">Announcement of the Winners</span>
                </div>
                <div className="bg-slate-800/90 rounded-none p-3 flex items-center">
                  <span className="text-white font-semibold text-[11.2px] md:text-base leading-[20px] md:leading-normal">10<sup>th</sup> January</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Join the Challenge */}
      <section className="relative pt-12 md:pt-12 pb-12 md:pb-12 px-4 md:px-6 lg:px-8 bg-slate-800/50 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 id="how-to-join" className="text-2xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#how-to-join">HOW TO JOIN THE CHALLENGE</a>
          </h2>
          
          <div className="mb-6"></div>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-base md:text-2xl font-bold text-red-500 mb-3">
                01. Register for the Competition
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="text-base leading-[20px]">Sign in to the Archalley website and register between 11th November and 24th December 2025 by providing correct information & paying the registration fee.</li>
              </ul>
              </div>
            
            <div>
              <h3 className="text-base md:text-2xl font-bold text-red-500 mb-3">
                02. Chose your preferred category of participation
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="text-base leading-[20px]">Select one category - Physical, Digital, or Kids' Tree –and follow the terms & conditions for that category; non-compliance may lead to disqualification.</li>
              </ul>
              </div>
            
            <div>
              <h3 className="text-base md:text-2xl font-bold text-red-500 mb-3">
                03. Create/Design your Christmas tree
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="text-base leading-[20px]">Enjoy full creative freedom on color, materials, size, and decoration (In compliance with the terms & conditions for your selected category).</li>
                <li className="text-base leading-[20px]">Ensure your design aligns with the Key Design Considerations of the competition.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-base md:text-2xl font-bold text-red-500 mb-3">
                04. Prepare Your Submission Materials
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="text-base leading-[20px]">Compile the require submission items for your selected category.</li>
                <li className="text-base leading-[20px]">You may also add optional document or optional video (per the terms & conditions ) to strengthen your entry.</li>
              </ul>
              </div>
            
            <div>
              <h3 className="text-base md:text-2xl font-bold text-red-500 mb-3">
                05. Submission
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="text-base leading-[20px]">Kids' Tree Category - From 11th to 21st December 2025</li>
                <li className="text-base leading-[20px]">Physical Tree Category & Digital Tree Category - From 11th to 24th December 2025</li>
              </ul>
              </div>
            </div>
          
          <div className="mt-8">
            <p className="text-[11.2px] md:text-base text-gray-400 italic leading-[20px] md:leading-normal">
              Note:-Refer to this brochure & terms & conditions for all required information.
                </p>
              </div>
            </div>
      </section>

        {/* Shared Sections - Always visible on desktop, visible on all tabs on mobile */}
        <div className="md:block block">

      {/* FAQ Section */}
      <section className="relative py-12 md:py-12 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          <h2 id="faq" className="text-2xl md:text-4xl font-bold text-center text-white mb-12 uppercase tracking-wide scroll-mt-20">
            <a href="#faq">FAQ</a>
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="bg-slate-800/70 rounded-none p-6">
                <h3 className="text-base md:text-xl font-bold text-white mb-3 leading-[20px] md:leading-normal">
                  Q: Can I submit more than one entry?
                </h3>
                <p className="text-white text-base leading-[20px]">
                  A: Yes! You can submit multiple entries, But each should go under separate registrations.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-none p-6">
                <h3 className="text-base md:text-xl font-bold text-white mb-3 leading-[20px] md:leading-normal">
                  Q: Can I collaborate with others?
                </h3>
                <p className="text-white text-base leading-[20px]">
                  A: Yes. Group submissions are allowed as a team or a company.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-none p-6">
                <h3 className="text-base md:text-xl font-bold text-white mb-3 leading-[20px] md:leading-normal">
                  Q: Are international entries allowed?
                </h3>
                <p className="text-white text-base leading-[20px]">
                  A: Absolutely. We welcome entries from around the world.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-none p-6">
                <h3 className="text-base md:text-xl font-bold text-white mb-3 leading-[20px] md:leading-normal">
                  Q: Do I have to build the physical model?
                </h3>
                <p className="text-white text-base leading-[20px]">
                  A: Only if you choose the physical tree category. Digital entries are equally accepted.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-none p-6">
                <h3 className="text-base md:text-xl font-bold text-white mb-3 leading-[20px] md:leading-normal">
                  Q: What format should I submit digital work in?
                </h3>
                <p className="text-white text-base leading-[20px]">
                  A: JPG format is the accepted format for all submissions, other than the optional documents.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-none p-6">
                <h3 className="text-base md:text-xl font-bold text-white mb-3 leading-[20px] md:leading-normal">
                  Q: Can the tree be of any size?
                </h3>
                <p className="text-white text-base leading-[20px]">
                  A: Yes, There are no limitations for the sizes.
                </p>
              </div>
              
              <div className="bg-slate-800/70 rounded-none p-6">
                <h3 className="text-base md:text-xl font-bold text-white mb-3 leading-[20px] md:leading-normal">
                  Q: I'm 12 or younger. Can I join?
                </h3>
                <p className="text-white text-base leading-[20px]">
                  A: Yes! Submit under the Kids' Category – any format is allowed.
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <p className="text-[11.2px] md:text-base text-gray-400 italic text-center leading-[20px] md:leading-normal">
                Note:-Refer to terms & conditions for all required information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="relative py-8 md:py-12 px-4 md:px-6 lg:px-8 bg-black z-20">
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr] gap-8 items-center">
            {/* Left Side - Text */}
            <div className="pr-0 lg:pr-8">
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                Contact Us
              </h2>
              <p className="text-white text-sm md:text-base leading-relaxed">
                If you have any questions or need assistance regarding the competition, feel free to reach out to us:
              </p>
            </div>

            {/* Vertical Line - Only visible on large screens */}
            <div className="hidden lg:block h-48 bg-white w-px"></div>

            {/* Right Side - Contact Buttons */}
            <div className="flex flex-col gap-3 pl-0 lg:pl-8">
              {/* Phone Number */}
              <a 
                href="tel:+94777863015"
                className="flex items-center justify-center gap-3 border-2 border-white text-white px-4 py-3 text-base font-semibold hover:bg-white hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                +94 77 786 3015
              </a>

              {/* WhatsApp */}
              <a 
                href="https://wa.me/94777863015"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-[#25D366] text-white px-4 py-3 text-base font-semibold hover:bg-[#1fa855] transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                +94 77 786 3015
              </a>

              {/* Email */}
              <a 
                href="mailto:competitions@archalley.com"
                className="flex items-center justify-center gap-3 border-2 border-white text-white px-4 py-3 text-base font-semibold hover:bg-white hover:text-black transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                competitions@archalley.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="relative bg-slate-950/90 py-16 px-4 md:px-6 lg:px-8 z-20">
        <div className="max-w-7xl mx-auto relative">
          {/* Official Partners */}
          <div className="text-center mb-10">
            <h3 className="text-lg md:text-2xl font-bold text-white mb-6 leading-[20px] md:leading-normal">Official Partners</h3>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-10">
              <div className="h-20 md:h-28 flex items-center">
                <Image
                  src="/uploads/A-Plus-Logo.jpg"
                  alt="A PLUS"
                  width={180}
                  height={100}
                  className="object-contain h-full w-auto"
                />
              </div>
              <div className="h-20 md:h-28 flex items-center">
                <Image
                  src="/uploads/ABrand-Logo.jpg"
                  alt="A BRAND"
                  width={180}
                  height={100}
                  className="object-contain h-full w-auto"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button
              asChild
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
            >
              <Link href="/events/archalley-competition-2025/register">
                Register Now
              </Link>
            </Button>
            <Button
              asChild
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 text-sm md:text-base w-40 md:w-auto rounded-none"
            >
              <a 
                href="/downloads/Christmas Tree Competition 2025 - Brief.pdf"
                download="Christmas Tree Competition 2025 - Brief.pdf"
              >
                Download Brief
              </a>
            </Button>
          </div>
        </div>
      </footer>
          </div>
        </div>
      </div>
    </div>
  )
}
