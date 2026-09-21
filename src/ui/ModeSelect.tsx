import { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Globe } from 'lucide-react';
import { sound } from '../app/audio';

interface ModeSelectProps {
  onBack: () => void;
  lang: 'ru' | 'en';
  onToggleLang: () => void;
}

export default function ModeSelect({ onBack, lang, onToggleLang }: ModeSelectProps) {
  const [muted, setMuted] = useState(sound.isMuted);
  const [imageError, setImageError] = useState(false);

  const toggleSound = () => {
    sound.isMuted = !sound.isMuted;
    setMuted(sound.isMuted);
    if (!sound.isMuted) {
      sound.playClick();
    }
  };

  const handleAction = () => {
    sound.playClick();
  };

  const handleBack = () => {
    sound.playClick();
    onBack();
  };

  const handleLang = () => {
    sound.playClick();
    setImageError(false);
    onToggleLang();
  };

  const modeImg = lang === 'ru' ? '/modechoose.png' : '/modechoose1.png';

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
        left: '24px',
        zIndex: 10
      }}>
        <button
          onClick={handleBack}
          style={{
            background: '#1a080a',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '0px',
            color: '#ffffff',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div style={{
        position: 'absolute',
        top: '16px',
        right: '24px',
        display: 'flex',
        gap: '10px',
        zIndex: 10
      }}>
        <button
          onClick={handleLang}
          style={{
            background: '#1a080a',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '0px',
            color: '#ffffff',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <Globe size={16} />
          <span>{lang.toUpperCase()}</span>
        </button>

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
        transform: 'translateY(1.5vh)',
        zIndex: 5
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          minHeight: '80px'
        }}>
          {!imageError ? (
            <img
              src={modeImg}
              alt="Mode Choose"
              onError={() => setImageError(true)}
              style={{
                maxWidth: '52vw',
                maxHeight: '18vh',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.4)'
            }} />
          )}
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <button className="menu-btn" onClick={handleAction}>
            {lang === 'ru' ? 'ОДИНОЧНЫЙ' : 'SINGLEPLAYER'}
          </button>
          <button className="menu-btn" onClick={handleAction}>
            {lang === 'ru' ? 'МУЛЬТИПЛЕЕР' : 'MULTIPLAYER'}
          </button>
          <button className="menu-btn" onClick={handleAction}>
            {lang === 'ru' ? 'СЦЕНАРИИ' : 'SCENARIOS'}
          </button>
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
        ALPHA v0.2.0
      </div>
    </div>
  );
}
