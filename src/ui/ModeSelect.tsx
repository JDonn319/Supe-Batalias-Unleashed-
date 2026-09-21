import { ArrowLeft } from 'lucide-react';
import { sound } from '../app/audio';

interface ModeSelectProps {
  onBack: () => void;
  onSinglePlayer: () => void;
}

export default function ModeSelect({ onBack, onSinglePlayer }: ModeSelectProps) {
  const handleSinglePlayer = () => {
    sound.playClick();
    onSinglePlayer();
  };

  const handleAction = () => {
    sound.playClick();
  };

  const handleBack = () => {
    sound.playClick();
    onBack();
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
            gap: '8px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>НАЗАД</span>
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        zIndex: 5
      }}>
        <button className="menu-btn" onClick={handleAction}>СЮЖЕТ</button>
        <button className="menu-btn" onClick={handleSinglePlayer}>ОДИНОЧНАЯ ИГРА</button>
        <button className="menu-btn" onClick={handleAction}>МУЛЬТИПЛЕЕР</button>
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
