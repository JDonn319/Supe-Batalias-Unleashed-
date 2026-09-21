import { useEffect, useState } from 'react';

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
        @keyframes logoPulseGlow {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(56, 189, 248, 0.45)); }
          50% { filter: drop-shadow(0 0 35px rgba(56, 189, 248, 0.95)); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '60px',
        animation: 'logoPulseGlow 3s infinite ease-in-out'
      }}>
        <img
          src="/logo.png"
          alt="Iron Man Unleashed Silhoette"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          style={{
            maxWidth: '55vw',
            maxHeight: '35vh',
            objectFit: 'contain',
            filter: 'grayscale(100%) brightness(20%)',
            opacity: 0.6
          }}
        />

        <img
          src="/logo.png"
          alt="Iron Man Unleashed Color"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            clipPath: `inset(0 0 ${100 - progress}% 0)`,
            transition: 'clip-path 0.05s linear'
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
          backgroundColor: '#1e293b',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#38bdf8',
            transition: 'width 0.05s linear'
          }} />
        </div>
      </div>
    </div>
  );
}
