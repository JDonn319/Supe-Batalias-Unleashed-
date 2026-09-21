import { useEffect, useState } from 'react';

export default function OrientationBlocker() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      backgroundColor: '#050505',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      letterSpacing: '2px',
      textAlign: 'center',
      padding: '20px'
    }}>
      <style>{`
        @keyframes rotatePhone {
          0% { transform: rotate(0deg); }
          30% { transform: rotate(-90deg); }
          70% { transform: rotate(-90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      
      <div style={{
        width: '50px',
        height: '80px',
        border: '3px solid #58a6ff',
        borderRadius: '10px',
        position: 'relative',
        animation: 'rotatePhone 2.5s ease-in-out infinite',
        marginBottom: '30px'
      }}>
        <div style={{
          width: '12px',
          height: '2px',
          backgroundColor: '#58a6ff',
          position: 'absolute',
          top: '6px',
          left: 'calc(50% - 6px)',
          borderRadius: '2px'
        }} />
      </div>

      <p style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', opacity: 0.9 }}>
        Пожалуйста, поверните устройство
      </p>
    </div>
  );
}
