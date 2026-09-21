import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../app/audio';

interface MainMenuProps {
  onStartGame: () => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [muted, setMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    sound.isMuted = !sound.isMuted;
    setMuted(sound.isMuted);
    if (!sound.isMuted) {
      sound.playClick();
    }
  };

  const handleStart = () => {
    sound.playClick();
    onStartGame();
  };

  const handleAction = () => {
    sound.playClick();
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#050203',
      background: 'radial-gradient(circle at center, #1c080b 0%, #000000 100%)',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes logoMenuGlow {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(239, 68, 68, 0.45)); }
          50% { filter: drop-shadow(0 0 50px rgba(239, 68, 68, 0.9)); }
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
          height: 38px;
          border-radius: 0px;
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #ffffff;
          font-family: sans-serif;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 4px;
          text-transform: uppercase;
          cursor: pointer;
          outline: none;
          position: relative;
          background: linear-gradient(180deg, #240e11 0%, #120507 100%);
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
          background: linear-gradient(180deg, #dc2626 0%, #991b1b 100%);
          border-color: #ef4444;
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
          onClick={toggleSound}
          style={{
            background: '#1a080a',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '0px',
            color: '#ffffff',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {muted ? <VolumeX size={18} color="#ef4444" /> : <Volume2 size={18} color="#ffffff" />}
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translateY(2.5vh)',
        zIndex: 5
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          animation: 'logoMenuGlow 3.5s infinite ease-in-out'
        }}>
          <img
            src="/logo.png"
            alt="Iron Man Unleashed"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            style={{
              maxWidth: '58vw',
              maxHeight: '34vh',
              objectFit: 'contain'
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <button className="menu-btn" onClick={handleStart}>НАЧАТЬ</button>
          <button className="menu-btn" onClick={handleAction}>ХРАНИЛИЩЕ</button>
          <button className="menu-btn" onClick={handleAction}>ЛИДЕРЫ</button>
        </div>
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
