import React, { useEffect, useRef } from 'react';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

export const Turnstile: React.FC<TurnstileProps> = ({ siteKey, onVerify, onExpire }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widgetId: string | null = null;

    const renderWidget = () => {
      if (containerRef.current && window.turnstile) {
        try {
          widgetId = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            'expired-callback': onExpire,
          });
        } catch (err) {
          console.warn('Turnstile rendering failed:', err);
        }
      }
    };

    // Inject script tag
    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        renderWidget();
      };
    } else {
      renderWidget();
    }

    return () => {
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch (err) {
          console.warn('Turnstile remove failed:', err);
        }
      }
    };
  }, [siteKey, onVerify, onExpire]);

  return <div ref={containerRef} className="my-3 flex justify-center" />;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export default Turnstile;
