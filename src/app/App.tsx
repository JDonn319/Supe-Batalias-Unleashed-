import { useState, useEffect } from 'react';
import OrientationBlocker from '../ui/OrientationBlocker';
import LoadingScreen from '../ui/LoadingScreen';
import MainMenu from '../ui/MainMenu';
import ModeSelect from '../ui/ModeSelect';

export default function App() {
  const [screen, setScreen] = useState<'loading' | 'menu' | 'mode-select'>('loading');
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

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <OrientationBlocker isPortrait={isPortrait} />
      {screen === 'loading' && (
        <LoadingScreen isPortrait={isPortrait} onLoaded={() => setScreen('menu')} />
      )}
      {screen === 'menu' && (
        <MainMenu onStartGame={() => setScreen('mode-select')} />
      )}
      {screen === 'mode-select' && (
        <ModeSelect onBack={() => setScreen('menu')} />
      )}
    </main>
  );
}
