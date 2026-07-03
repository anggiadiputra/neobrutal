import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TIMEOUT_IN_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export default function IdleTimer() {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Check if token exists in localStorage, only start/reset timer if logged in
    const token = localStorage.getItem('token');
    if (!token) return;

    timeoutRef.current = setTimeout(() => {
      // Clear authentication credentials
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page with query parameter indicating timeout
      navigate('/login?reason=timeout');
    }, TIMEOUT_IN_MS);
  };

  useEffect(() => {
    // Standard user interaction events to monitor
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    // Initialize or reset the idle timer
    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    // Attach listener for each user activity event
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup listeners and active timer on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [location.pathname]); // Trigger recalculation when route changes to inspect login token presence

  return null;
}
