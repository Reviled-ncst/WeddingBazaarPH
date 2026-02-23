'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://weddingbazaarph-testing.up.railway.app';
const ANALYTICS_ENDPOINT = `${API_URL}/analytics/track.php`;

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Send analytics data (fire and forget)
async function sendAnalytics(data: Record<string, unknown>): Promise<void> {
  try {
    const sessionId = getSessionId();
    if (!sessionId) return;
    
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, sessionId }),
      keepalive: true // Ensure request completes even on page unload
    });
  } catch {
    // Silently fail - analytics should never break the app
  }
}

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: NodeJS.Timeout;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

// Throttle helper
function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let lastCall = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

export function useAnalytics() {
  const pathname = usePathname();
  const pageViewIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const maxScrollDepthRef = useRef<number>(0);
  const hasTrackedPageView = useRef<string>('');

  // Track page view
  const trackPageView = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (hasTrackedPageView.current === pathname) return;
    
    hasTrackedPageView.current = pathname;
    startTimeRef.current = Date.now();
    maxScrollDepthRef.current = 0;

    try {
      const response = await fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pageview',
          sessionId: getSessionId(),
          path: pathname,
          title: document.title,
          referrer: document.referrer,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        })
      });
      
      const data = await response.json();
      if (data.success && data.pageViewId) {
        pageViewIdRef.current = data.pageViewId;
      }
    } catch {
      // Silently fail
    }
  }, [pathname]);

  // Track click events
  const trackClick = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;

    sendAnalytics({
      type: 'click',
      pageViewId: pageViewIdRef.current,
      path: pathname,
      elementTag: target.tagName.toLowerCase(),
      elementId: target.id || null,
      elementClass: target.className?.toString()?.slice(0, 500) || null,
      elementText: target.textContent?.slice(0, 255) || null,
      clickX: event.clientX,
      clickY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight
    });
  }, [pathname]);

  // Track scroll depth
  const trackScroll = useCallback(
    throttle(() => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const viewportHeight = window.innerHeight;
      const scrollDepth = Math.round((scrollTop + viewportHeight) / docHeight * 100);

      if (scrollDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollDepth;
        
        // Only track significant scroll changes (every 10%)
        if (scrollDepth % 10 === 0 || scrollDepth >= 90) {
          sendAnalytics({
            type: 'scroll',
            pageViewId: pageViewIdRef.current,
            path: pathname,
            scrollDepth,
            scrollY: scrollTop,
            pageHeight: docHeight,
            viewportHeight
          });
        }
      }
    }, 500),
    [pathname]
  );

  // Track time on page before unload
  const trackTimeOnPage = useCallback(() => {
    const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    // Use sendBeacon for reliability on page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify({
        type: 'time',
        sessionId: getSessionId(),
        pageViewId: pageViewIdRef.current,
        timeOnPage
      }));
    } else {
      sendAnalytics({
        type: 'time',
        pageViewId: pageViewIdRef.current,
        timeOnPage
      });
    }
  }, []);

  // Track custom events
  const trackEvent = useCallback((
    eventName: string,
    eventCategory?: string,
    eventLabel?: string,
    eventValue?: number,
    properties?: Record<string, unknown>
  ) => {
    sendAnalytics({
      type: 'event',
      eventName,
      eventCategory,
      eventLabel,
      eventValue,
      path: pathname,
      properties
    });
  }, [pathname]);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    trackPageView();

    // Click tracking
    document.addEventListener('click', trackClick, { passive: true });

    // Scroll tracking
    window.addEventListener('scroll', trackScroll, { passive: true });

    // Track time on page when leaving
    window.addEventListener('beforeunload', trackTimeOnPage);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      }
    });

    return () => {
      document.removeEventListener('click', trackClick);
      window.removeEventListener('scroll', trackScroll);
      window.removeEventListener('beforeunload', trackTimeOnPage);
      trackTimeOnPage(); // Track time when navigating away
    };
  }, [pathname, trackPageView, trackClick, trackScroll, trackTimeOnPage]);

  return {
    trackEvent,
    pageViewId: pageViewIdRef.current,
    sessionId: getSessionId()
  };
}

// Provider component that can be used in layout
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}
