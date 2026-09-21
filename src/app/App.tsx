import { useState } from 'react';
import OrientationBlocker from '../ui/OrientationBlocker';
import LoadingScreen from '../ui/LoadingScreen';
import MainMenu from '../ui/MainMenu';

export default function App() {
  const [screen, setScreen] = useState<'loading' | 'menu'>('loading');

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <OrientationBlocker />
      {screen === 'loading' ? (
        <LoadingScreen onLoaded={() => setScreen('menu')} />
      ) : (
        <MainMenu />
      )}
    </main>
  );
}
