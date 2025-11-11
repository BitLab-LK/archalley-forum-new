/**
 * Example: How to use Google Analytics tracking in your components
 * 
 * This file demonstrates various ways to track user interactions
 * Copy and adapt these patterns to your actual components
 */

'use client';

import { event, trackButtonClick, trackSearch, trackShare, trackSignup, trackLogin } from '@/lib/google-analytics';

export function AnalyticsExamples() {
  // Example 1: Track a simple button click
  const handleButtonClick = () => {
    trackButtonClick('Example Button');
    console.log('Button clicked!');
  };

  // Example 2: Track search
  const handleSearch = (searchQuery: string) => {
    trackSearch(searchQuery);
    console.log('Searching for:', searchQuery);
  };

  // Example 3: Track social share
  const handleShare = (platform: string, contentId: string) => {
    trackShare('post', contentId);
    console.log(`Sharing on ${platform}`);
  };

  // Example 4: Track user signup
  const handleSignup = (method: 'email' | 'google' | 'facebook') => {
    trackSignup(method);
    console.log(`User signed up with ${method}`);
  };

  // Example 5: Track user login
  const handleLogin = (method: 'email' | 'google' | 'facebook') => {
    trackLogin(method);
    console.log(`User logged in with ${method}`);
  };

  // Example 6: Track custom events with full control
  const handleCustomEvent = () => {
    event({
      action: 'download',
      category: 'engagement',
      label: 'whitepaper_pdf',
      value: 1,
    });
    console.log('Custom event tracked');
  };

  // Example 7: Track form submission
  const handleFormSubmit = (formName: string) => {
    event({
      action: 'form_submit',
      category: 'forms',
      label: formName,
    });
    console.log(`Form ${formName} submitted`);
  };

  // Example 8: Track video interaction
  const handleVideoPlay = (videoTitle: string) => {
    event({
      action: 'video_play',
      category: 'media',
      label: videoTitle,
    });
    console.log(`Video ${videoTitle} played`);
  };

  // Example 9: Track e-commerce action (competition entry payment)
  const handlePaymentComplete = (amount: number, competitionId: string) => {
    event({
      action: 'purchase',
      category: 'ecommerce',
      label: `competition_${competitionId}`,
      value: amount,
    });
    console.log(`Payment of ${amount} completed for competition ${competitionId}`);
  };

  // Example 10: Track navigation/tab changes
  const handleTabChange = (tabName: string) => {
    event({
      action: 'tab_change',
      category: 'navigation',
      label: tabName,
    });
    console.log(`Changed to ${tabName} tab`);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Google Analytics Examples</h2>
      
      <button onClick={handleButtonClick} className="btn">
        Track Button Click
      </button>
      
      <button onClick={() => handleSearch('example query')} className="btn">
        Track Search
      </button>
      
      <button onClick={() => handleShare('twitter', 'post-123')} className="btn">
        Track Share
      </button>
      
      <button onClick={() => handleSignup('google')} className="btn">
        Track Signup
      </button>
      
      <button onClick={() => handleLogin('email')} className="btn">
        Track Login
      </button>
      
      <button onClick={handleCustomEvent} className="btn">
        Track Custom Event
      </button>
      
      <button onClick={() => handleFormSubmit('contact_form')} className="btn">
        Track Form Submit
      </button>
      
      <button onClick={() => handleVideoPlay('Tutorial Video')} className="btn">
        Track Video Play
      </button>
      
      <button onClick={() => handlePaymentComplete(50, 'comp-456')} className="btn">
        Track Payment
      </button>
      
      <button onClick={() => handleTabChange('settings')} className="btn">
        Track Tab Change
      </button>
    </div>
  );
}

/**
 * INTEGRATION EXAMPLES FOR ACTUAL COMPONENTS
 */

// Example: Add to your search component
/*
'use client';
import { trackSearch } from '@/lib/google-analytics';

export function SearchBar() {
  const handleSearch = (query: string) => {
    trackSearch(query);
    // ... rest of search logic
  };
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}
*/

// Example: Add to your post card component
/*
'use client';
import { event } from '@/lib/google-analytics';

export function PostCard({ post }) {
  const handleLike = () => {
    event({
      action: 'like',
      category: 'engagement',
      label: `post_${post.id}`,
    });
    // ... rest of like logic
  };
  
  return <button onClick={handleLike}>Like</button>;
}
*/

// Example: Add to your auth form
/*
'use client';
import { trackSignup } from '@/lib/google-analytics';

export function SignupForm() {
  const handleSubmit = async (method: string) => {
    trackSignup(method);
    // ... rest of signup logic
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
*/
