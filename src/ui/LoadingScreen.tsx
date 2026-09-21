import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

export default function LoadingScreen({ onLoaded }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('ИНИЦИАЛИЗАЦИЯ ДУГОВОГО РЕАКТОРА...');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        
        if (next === 25) setStatusText('КАЛИБРОВКА РЕПУЛЬСОРОВ...');
        if (next === 60) setStatusText('ПОДКЛЮЧЕНИЕ СИСТЕМ НАВЕДЕНИЯ...');
        if (next === 85) setStatusText('ЗАГРУЗКА БОРТОВОГО ИИ...');

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onLoaded, 400);
          return 100;
        }
        return next;
      });
    }, 28);

    return () => clearInterval(interval);
  }, [onLoaded]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.4)); opacity: 0.85; }
          50% { filter: drop-shadow(0 0 35px rgba(59, 130, 246, 0.9)); opacity: 1; }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '50px',
        animation: 'pulseGlow 2.5s infinite ease-in-out'
      }}>
        <img
          src="/logo.png"
          alt="Iron Man Unleashed"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          style={{
            maxWidth: '55vw',
            maxHeight: '35vh',
            objectFit: 'contain'
          }}
        />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12%',
        width: '55%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span style={{
          color: '#8ab4f8',
          fontSize: '11px',
          letterSpacing: '3px',
          fontFamily: 'sans-serif',
          fontWeight: 700,
          marginBottom: '10px'
        }}>
          {statusText}
        </span>

        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
          boxShadow: '0 0 10px rgba(0,0,0,0.8)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 12px #38bdf8, 0 0 4px #ffffff',
            transition: 'width 0.05s linear'
          }} />
        </div>
      </div>
    </div>
  );
}
