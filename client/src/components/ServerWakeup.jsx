import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ServerWakeup({ children }) {
  const [isAwake, setIsAwake] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  useEffect(() => {
    let intervalId;
    let timeoutId;

    const checkServer = async () => {
      try {
        // We use a raw axios request here without interceptors
        // to avoid triggering any auth refresh logic or error toasts.
        const res = await axios.get('/api/health', {
          timeout: 10000,
        });

        // Ensure we actually got our JSON payload, not a Render HTML error page
        if (res.data && res.data.status === 'ok') {
          setIsAwake(true);
          setIsChecking(false);
          if (intervalId) clearInterval(intervalId);
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (error) {
        // Backend is still sleeping / starting up
        setIsChecking(true);
      }
    };

    // Initial check
    checkServer();

    // Poll every 3 seconds
    intervalId = setInterval(() => {
      if (!isAwake) {
        checkServer();
      }
    }, 3000);

    // Show a message if it takes longer than 5 seconds
    timeoutId = setTimeout(() => {
      setShowLongWaitMessage(true);
    }, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isAwake]);

  if (isAwake) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 text-white overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="relative flex flex-col items-center z-10 max-w-md text-center px-6">
        {/* Animated Rings */}
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-[spin_1.5s_linear_infinite]"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-violet-400 animate-[spin_2s_linear_infinite_reverse]"></div>
          <div className="absolute inset-4 rounded-full border-b-2 border-fuchsia-500 animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 text-transparent bg-clip-text animate-pulse">
          Waking up the server
        </h1>
        
        <p className="text-gray-400 mb-6 text-sm md:text-base leading-relaxed h-12">
          {showLongWaitMessage ? (
            <span className="animate-fade-in block">
              Since we use a free tier, this might take up to 50 seconds.<br/>
              Thanks for your patience!
            </span>
          ) : (
            <span className="animate-fade-in block">
              Connecting to the backend infrastructure...
            </span>
          )}
        </p>

        {/* Progress Bar Visualizer */}
        <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 w-full origin-left animate-[scale-x_2s_ease-in-out_infinite_alternate]"></div>
        </div>
      </div>

      <style>{`
        @keyframes scale-x {
          0% { transform: scaleX(0.1); transform-origin: left; }
          50% { transform: scaleX(1); transform-origin: left; }
          50.1% { transform: scaleX(1); transform-origin: right; }
          100% { transform: scaleX(0.1); transform-origin: right; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
