import { useState } from 'react';

export default function MainMenu() {
  const [isMuted, setIsMuted] = useState(false);

  const handleAction = () => {};

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: '#020408',
      background: 'radial-gradient(circle at center, #0b1329 0%, #000000 100%)',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes logoMenuGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.4)); }
          50% { filter: drop-shadow(0 0 35px rgba(56, 189, 248, 0.85)); }
        }

        @keyframes glitchFlicker {
          0% { opacity: 0.95; }
          49% { opacity: 0.95; }
          50% { opacity: 0.75; transform: skewX(-0.5deg); }
          52% { opacity: 0.95; transform: skewX(0deg); }
          80% { opacity: 0.95; }
          82% { opacity: 0.8; transform: translateX(1px); }
          84% { opacity: 0.95; transform: translateX(0); }
          100% { opacity: 0.95; }
        }

        .menu-btn {
          width: 540px;
          max-width: 82vw;
          height: 48px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #ffffff;
          font-family: sans-serif;
          font-weight: 800;
          font-size: 15px;
          letter-spacing: 4px;
          text-transform: uppercase;
          cursor: pointer;
          outline: none;
          position: relative;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease, border-color 0.15s ease;
          animation: glitchFlicker 6s infinite ease-in-out;
        }

        .menu-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.04) 0px,
            rgba(255, 255, 255, 0.04) 1px,
            transparent 1px,
            transparent 3px
          );
          pointer-events: none;
        }

        .menu-btn:hover, .menu-btn:active {
          background: linear-gradient(180deg, #0284c7 0%, #0369a1 100%);
          border-color: #38bdf8;
          color: #ffffff;
        }
      `}</style>

      <div style={{
        position: 'absolute',
        top: '16px',
        right: '24px',
        zIndex: 10
      }}>
        <button
          onClick={() => setIsMuted(!isMuted)}
          style={{
            background: '#0f172a',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '4px',
            color: '#ffffff',
            padding: '6px 14px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            cursor: 'pointer'
          }}
        >
          {isMuted ? 'MUTE' : 'SOUND'}
        </button>
      </div>

      <div style={{
        marginTop: '3vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        animation: 'logoMenuGlow 3.5s infinite ease-in-out'
      }}>
        <img
          src="/logo.png"
          alt="Iron Man Unleashed"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          style={{
            maxWidth: '46vw',
            maxHeight: '26vh',
            objectFit: 'contain'
          }}
        />
      </div>

      <div style={{
        marginTop: '4vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 5
      }}>
        <button className="menu-btn" onClick={handleAction}>НАЧАТЬ</button>
        <button className="menu-btn" onClick={handleAction}>ХРАНИЛИЩЕ</button>
        <button className="menu-btn" onClick={handleAction}>ЛИДЕРЫ</button>
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
