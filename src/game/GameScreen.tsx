import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ArrowLeft } from 'lucide-react';
import Compass from './Compass';
import Joystick from './Joystick';
import { sound } from '../app/audio';

interface GameScreenProps {
  onBack: () => void;
}

const CHUNK_SIZE = 40;
const CHUNK_RADIUS = 3;

export default function GameScreen({ onBack }: GameScreenProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const moveVectorRef = useRef({ x: 0, y: 0 });
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const [debugLog, setDebugLog] = useState('Диагностика систем...');

  const [hudData, setHudData] = useState({
    rotation: 0,
    playerPos: [0, 0] as [number, number],
  });

  const cameraAnglesRef = useRef({ yaw: 0, pitch: 0.1 });
  const touchRightIdRef = useRef<number | null>(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });

  const spawnPos: [number, number] = [0, 0];
  const questPos: [number, number] = [160, -220];

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.008);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      600
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mountRef.current.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    sunLight.position.set(40, 80, 50);
    scene.add(sunLight);

    const skyGeo = new THREE.SphereGeometry(450, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      side: THREE.BackSide
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    const createProceduralTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#374151';
      ctx.fillRect(0, 0, 512, 512);

      const slab = 256;
      for (let x = 0; x < 512; x += slab) {
        for (let y = 0; y < 512; y += slab) {
          ctx.fillStyle = (x + y) % (slab * 2) === 0 ? '#475569' : '#334155';
          ctx.fillRect(x + 3, y + 3, slab - 6, slab - 6);

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 6;
          ctx.strokeRect(x, y, slab, slab);
        }
      }

      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(10, 10);
      return texture;
    };

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = createProceduralTexture();

    const floorGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
    floorGeo.rotateX(-Math.PI / 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.85,
      metalness: 0.1
    });

    textureLoader.load(
      '/textures/concrete.jpg',
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.RepeatWrapping;
        loadedTex.repeat.set(10, 10);
        floorMat.map = loadedTex;
        floorMat.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    const chunks = new Map<string, THREE.Mesh>();

    const updateChunks = (px: number, pz: number) => {
      const curCx = Math.floor(px / CHUNK_SIZE);
      const curCz = Math.floor(pz / CHUNK_SIZE);
      const activeKeys = new Set<string>();

      for (let x = -CHUNK_RADIUS; x < CHUNK_RADIUS; x++) {
        for (let z = -CHUNK_RADIUS; z < CHUNK_RADIUS; z++) {
          const cx = curCx + x;
          const cz = curCz + z;
          const key = `${cx},${cz}`;
          activeKeys.add(key);

          if (!chunks.has(key)) {
            const mesh = new THREE.Mesh(floorGeo, floorMat);
            mesh.position.set(cx * CHUNK_SIZE + CHUNK_SIZE / 2, 0, cz * CHUNK_SIZE + CHUNK_SIZE / 2);
            scene.add(mesh);
            chunks.set(key, mesh);
          }
        }
      }

      chunks.forEach((mesh, key) => {
        if (!activeKeys.has(key)) {
          scene.remove(mesh);
          chunks.delete(key);
        }
      });
    };

    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    const visualModelGroup = new THREE.Group();
    playerGroup.add(visualModelGroup);

    const suitPivot = new THREE.Group();
    visualModelGroup.add(suitPivot);

    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;

    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    const normalizeBone = (str: string) => {
      return str
        .toLowerCase()
        .replace(/^.*[|/:]/, '')
        .replace(/mixamorig\d*/g, '')
        .replace(/[^a-z0-9]/g, '');
    };

    gltfLoader.load(
      '/models/suits/mark3.glb',
      (suitGltf) => {
        const suitModel = suitGltf.scene;

        let totalBones = 0;
        const boneMap = new Map<string, string>();
        let firstBoneName = '';

        suitModel.traverse((child) => {
          if ((child as THREE.Bone).isBone) {
            totalBones++;
            if (!firstBoneName) firstBoneName = child.name;
            const clean = normalizeBone(child.name);
            boneMap.set(clean, child.name);
          }
          if ((child as THREE.Mesh).isMesh) {
            const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
            if (m) {
              m.metalness = Math.min(m.metalness ?? 0.8, 0.85);
              m.roughness = Math.max(m.roughness ?? 0.3, 0.25);
              m.envMapIntensity = 2.0;
              m.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(suitModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const targetHeight = 2.1;
        const scaleFactor = targetHeight / (size.y || 1);
        suitModel.scale.setScalar(scaleFactor);

        suitModel.position.x = -center.x * scaleFactor;
        suitModel.position.y = -box.min.y * scaleFactor;
        suitModel.position.z = -center.z * scaleFactor;

        suitPivot.rotation.y = -Math.PI / 2;
        suitPivot.add(suitModel);

        mixer = new THREE.AnimationMixer(suitModel);

        fbxLoader.load(
          '/models/animations/walk.fbx',
          (animFbx) => {
            if (animFbx.animations && animFbx.animations.length > 0 && mixer) {
              const clip = animFbx.animations[0];
              let matchedTracks = 0;
              const sampleFbx = clip.tracks[0]?.name || '';

              clip.tracks.forEach((track) => {
                const lastDot = track.name.lastIndexOf('.');
                const bonePath = track.name.substring(0, lastDot);
                const property = track.name.substring(lastDot + 1);

                const cleanTrack = normalizeBone(bonePath);

                if (boneMap.has(cleanTrack)) {
                  const targetName = boneMap.get(cleanTrack)!;
                  track.name = `${targetName}.${property}`;
                  matchedTracks++;
                }
              });

              if (matchedTracks > 0) {
                walkAction = mixer.clipAction(clip);
                walkAction.setLoop(THREE.LoopRepeat, Infinity);
                setDebugLog(`Костей: ${totalBones} | Связано: ${matchedTracks} (АНИМАЦИЯ ГОТОВА)`);
              } else {
                setDebugLog(`0 треков | FBX: "${sampleFbx.slice(0, 16)}" | Кость: "${firstBoneName.slice(0, 16)}"`);
              }
            } else {
              setDebugLog(`Костей: ${totalBones} | В walk.fbx нет анимации`);
            }
            setIsAssetsLoading(false);
          },
          undefined,
          () => {
            setDebugLog(`Костей: ${totalBones} | Файл walk.fbx не найден (404)`);
            setIsAssetsLoading(false);
          }
        );
      },
      undefined,
      () => {
        setDebugLog('Ошибка: mark3.glb не найден');
        setIsAssetsLoading(false);
      }
    );

    const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 120, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.7 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(questPos[0], 60, questPos[1]);
    scene.add(beacon);

    let lastTime = performance.now();
    let currentSpeed = 0;
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const input = moveVectorRef.current;
      const isInputActive = Math.abs(input.x) > 0.05 || Math.abs(input.y) > 0.05;

      const targetSpeed = isInputActive ? 8.0 : 0;
      currentSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, delta * 10);

      const camYaw = cameraAnglesRef.current.yaw;
      playerGroup.rotation.y = camYaw;

      const forwardX = -Math.sin(camYaw);
      const forwardZ = -Math.cos(camYaw);
      const rightX = Math.cos(camYaw);
      const rightZ = -Math.sin(camYaw);

      if (currentSpeed > 0.05) {
        const moveDirX = rightX * input.x + forwardX * (-input.y);
        const moveDirZ = rightZ * input.x + forwardZ * (-input.y);

        playerGroup.position.x += moveDirX * currentSpeed * delta;
        playerGroup.position.z += moveDirZ * currentSpeed * delta;

        if (walkAction) {
          if (!walkAction.isRunning()) {
            walkAction.reset().play();
          }
          walkAction.timeScale = 1.0;
        }
      } else {
        if (walkAction && walkAction.isRunning()) {
          walkAction.timeScale = 0;
        }
      }

      if (mixer) {
        mixer.update(delta);
      }

      const camPitch = cameraAnglesRef.current.pitch;
      const camDist = 2.4;
      const shoulderX = 0.55;
      const shoulderY = 1.75;

      const cosPitch = Math.cos(camPitch);
      const sinPitch = Math.sin(camPitch);

      const offsetX = rightX * shoulderX + Math.sin(camYaw) * (camDist * cosPitch);
      const offsetY = shoulderY + sinPitch * camDist;
      const offsetZ = rightZ * shoulderX + Math.cos(camYaw) * (camDist * cosPitch);

      camera.position.x = playerGroup.position.x + offsetX;
      camera.position.y = playerGroup.position.y + offsetY;
      camera.position.z = playerGroup.position.z + offsetZ;

      const lookTargetX = playerGroup.position.x + rightX * (shoulderX * 0.6);
      const lookTargetY = playerGroup.position.y + shoulderY * 0.95;
      const lookTargetZ = playerGroup.position.z + rightZ * (shoulderX * 0.6);

      camera.lookAt(lookTargetX, lookTargetY, lookTargetZ);

      skyDome.position.copy(playerGroup.position);
      updateChunks(playerGroup.position.x, playerGroup.position.z);

      setHudData({
        rotation: playerGroup.rotation.y,
        playerPos: [playerGroup.position.x, playerGroup.position.z],
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pmremGenerator.dispose();
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  const handleTouchStartRight = (e: React.TouchEvent) => {
    if (touchRightIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchRightIdRef.current = touch.identifier;
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMoveRight = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchRightIdRef.current) {
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        lastTouchRef.current = { x: touch.clientX, y: touch.clientY };

        cameraAnglesRef.current.yaw -= dx * 0.0055;
        cameraAnglesRef.current.pitch = THREE.MathUtils.clamp(
          cameraAnglesRef.current.pitch + dy * 0.0035,
          -0.2,
          0.5
        );
        break;
      }
    }
  };

  const handleTouchEndRight = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchRightIdRef.current) {
        touchRightIdRef.current = null;
        break;
      }
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {isAssetsLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#050203',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            border: '3px solid #22080a',
            borderTop: '3px solid #ef4444',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '20px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span style={{
            color: '#ef4444',
            fontFamily: 'sans-serif',
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '3px'
          }}>
            КАЛИБРОВКА СИСТЕМ КОСТЮМА...
          </span>
        </div>
      )}

      <div
        onTouchStart={handleTouchStartRight}
        onTouchMove={handleTouchMoveRight}
        onTouchEnd={handleTouchEndRight}
        onTouchCancel={handleTouchEndRight}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55%',
          height: '100%',
          touchAction: 'none',
          zIndex: 10
        }}
      />

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 15
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          border: '1px solid #ffffff',
          boxShadow: '0 0 6px #ef4444'
        }} />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: '5px 14px',
        borderRadius: '4px',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        color: '#38bdf8',
        fontFamily: 'monospace',
        fontSize: '11px',
        pointerEvents: 'none',
        zIndex: 25
      }}>
        {debugLog}
      </div>

      <Compass
        playerRotation={hudData.rotation}
        playerPos={hudData.playerPos}
        spawnPos={spawnPos}
        questPos={questPos}
      />

      <div style={{ position: 'absolute', top: '14px', left: '20px', zIndex: 30 }}>
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          style={{
            background: '#1a080a',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ffffff',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>МЕНЮ</span>
        </button>
      </div>

      <Joystick onMove={(vec) => { moveVectorRef.current = vec; }} />
    </div>
  );
}
