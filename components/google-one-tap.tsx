"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Script from "next/script";

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
          cancel: () => void;
          revoke: (hint: string, callback: () => void) => void;
        };
      };
    };
  }
}

export default function GoogleOneTap() {
  const { data: session } = useSession();
  const [isGoogleScriptLoaded, setIsGoogleScriptLoaded] = useState(false);
  const isInitializedRef = useRef(false);
  const initializationAttemptedRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCredentialResponse = useCallback(async (response: any) => {
    // Validate that we have a credential
    if (!response || !response.credential) {
      console.error("Google One Tap: No credential in response", response);
      // Return without throwing to prevent Google's library from showing error
      return;
    }

    try {
      // Note: This callback must not throw unhandled errors, as Google's FedCM library
      // will interpret any thrown errors as "Error retrieving a token" and display that error.
      // All errors are caught and handled below to prevent propagation to Google's library.
      const res = await fetch("/api/auth/google-one-tap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: response.credential,
        }),
      });

      // Handle non-OK responses
      if (!res.ok) {
        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          console.error("Google One Tap: Failed to parse error response", parseError);
          return;
        }

        if (data.redirectTo) {
          // New user, redirect to registration
          window.location.href = data.redirectTo;
        } else {
          console.error("Google One Tap error:", data.error || `HTTP ${res.status}`);
        }
        return;
      }

      // Parse success response
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Google One Tap: Failed to parse success response", parseError);
        // Still try to reload since the request succeeded
        window.location.reload();
        return;
      }

      // Success - reload page to reflect new session
      if (data.success !== false) {
        window.location.reload();
      }
    } catch (error) {
      // Log error but don't throw - we don't want to propagate errors to Google's library
      console.error("Error signing in with Google One Tap:", error);
      
      // Don't throw or re-throw the error - Google's library will handle the failure state
      // The error is already logged for debugging
    }
  }, []);

  const initializeGoogleOneTap = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.warn("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Google One Tap will not work.");
      return;
    }

    // Prevent multiple initializations
    if (isInitializedRef.current || initializationAttemptedRef.current) {
      return;
    }

    if (window.google && !session && !isInitializedRef.current) {
      initializationAttemptedRef.current = true;
      
      try {
        // Initialize Google One Tap
        // Note: If you're seeing CORS errors with FedCM ("Server did not send the correct CORS headers"),
        // it's likely a Google Cloud Console configuration issue. Check:
        // 1. Google Client ID is properly configured in Google Cloud Console
        // 2. Authorized JavaScript origins include your domain (e.g., http://localhost:3000 for dev)
        // 3. Authorized redirect URIs are set correctly
        // 4. FedCM is enabled for your OAuth client (should be automatic in newer clients)
        // 
        // If FedCM continues to cause issues, you can set use_fedcm_for_prompt to false
        // to use the legacy flow (without FedCM)
        const useFedCM = true; // Set to false if FedCM causes persistent CORS errors
        
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          context: "signin",
          ux_mode: "popup",
          auto_select: false,
          use_fedcm_for_prompt: useFedCM,
        });

        // Mark as initialized
        isInitializedRef.current = true;

        // Prompt One Tap
        // Note: With FedCM enabled, display moment methods (isDisplayMoment, isDisplayed, isNotDisplayed, getNotDisplayedReason)
        // and getSkippedReason() are no longer available. Only isSkippedMoment(), isDismissedMoment(), and getDismissedReason() work.
        window.google.accounts.id.prompt((notification: any) => {
          // Skip moment notification - reason details are not available with FedCM
          if (notification.isSkippedMoment()) {
            // getSkippedReason() is deprecated with FedCM, so we just log that it was skipped
            console.log("One Tap was skipped");
          } else if (notification.isDismissedMoment()) {
            // Dismissed moment and getDismissedReason() still work with FedCM
            const reason = notification.getDismissedReason();
            // Only log if it's not a successful credential return
            if (reason && reason !== 'credential_returned') {
              console.log("One Tap was dismissed:", reason);
            }
          }
        });
      } catch (error) {
        // Reset attempt flag on error so we can retry
        initializationAttemptedRef.current = false;
        
        // Check if it's a FedCM error - this is expected and can be safely ignored
        if (
          error instanceof Error &&
          (error.message.includes(
            "Only one navigator.credentials.get request may be outstanding at one time"
          ) || error.name === "NotAllowedError")
        ) {
          // FedCM error - silently handle, don't retry immediately
          // Google One Tap will handle this gracefully
          return;
        } else {
          // Other errors - log but don't spam
          console.error("Error initializing Google One Tap:", error);
        }
      }
    }
  }, [session, handleCredentialResponse]);

  useEffect(() => {
    if (isGoogleScriptLoaded && !session && !isInitializedRef.current) {
      // Add a small delay to ensure the script is fully loaded
      const timeoutId = setTimeout(() => {
        initializeGoogleOneTap();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      };
    }
  }, [isGoogleScriptLoaded, session, initializeGoogleOneTap]);

  useEffect(() => {
    if (session) {
      // If user is signed in, cancel any ongoing One Tap prompts
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          // Ignore errors when canceling
        }
      }
      // Reset initialization flags
      isInitializedRef.current = false;
      initializationAttemptedRef.current = false;
    }
  }, [session]);

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      async
      defer
      onLoad={() => setIsGoogleScriptLoaded(true)}
      strategy="afterInteractive"
    />
  );
}

