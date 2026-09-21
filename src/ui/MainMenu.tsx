import React, { useState } from 'react';

export default function MainMenu() {
  const [isMuted, setIsMuted] = useState(false);

  const buttonBaseStyle: React.CSSProperties = {
    width: '420px',
    maxWidth: '75vw',
    height: '42px',
    borderRadius: '4px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    color: '#ffffff',
    fontFamily: 'sans-serif',
    fontWeight: 800,
    fontSize: '15px',
    letterSpacing: '4px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
    backgroundSize: '100% 4px'
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 50%, #450a0a 100%)',
    borderColor: '#f87171',
    boxShadow: '0 0 15px rgba(185, 28, 28, 0.6)'
  };

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(180deg, #475569 0%, #1e293b 50%, #0f172a 100%)',
    borderColor: '#94a3b8'
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '30px 0 20px 0',
      backgroundColor: '#020408',
      backgroundRadial: 'radial-gradient(circle at center, #0f172a 0%, #000000 100%)',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes starsTwinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>

      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, transparent), radial-gradient(1px 1px at 80px 120px, #93c5fd, transparent), radial-gradient(1.5px 1.5px at 220px 80px, #ffffff, transparent), radial-gradient(1.2px 1.2px at 300px 180px, #60a5fa, transparent)',
        backgroundSize: '350px 350px',
        animation: 'starsTwinkle 4s infinite ease-in-out',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        top: '16px',
        right: '24px',
        display: 'flex',
        gap: '12px',
        zIndex: 10
      }}>
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.4)',
            borderRadius: '4px',
            color: '#ffffff',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {isMuted ? 'MUTE' : 'SOUND'}
        </button>
      </div>

      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5
      }}>
        <img
          src="/logo.png"
          alt="Iron Man Unleashed"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          style={{
            maxWidth: '48vw',
            maxHeight: '28vh',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 25px rgba(56, 189, 248, 0.5))'
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 5,
        marginBottom: '20px'
      }}>
        <button style={primaryButtonStyle}>НАЧАТЬ</button>
        <button style={secondaryButtonStyle}>АНГАР</button>
        <button style={secondaryButtonStyle}>ЛИДЕРЫ</button>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '20px',
        color: 'rgba(255, 255, 255, 0.25)',
        fontSize: '10px',
        letterSpacing: '2px',
        fontFamily: 'monospace'
      }}>
        ALPHA v0.1.0
      </div>
    </div>
  );
}
