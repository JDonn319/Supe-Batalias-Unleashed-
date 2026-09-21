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
    scene.background = new THREE.Color(0x93c5fd);
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.01);

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
    renderer.toneMappingExposure = 1.3;
    mountRef.current.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(40, 80, 50);
    scene.add(sunLight);

    const skyGeo = new THREE.SphereGeometry(450, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      side: THREE.BackSide
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    const createProceduralTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 256, 256);

      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }

      ctx.strokeStyle = 'rgba(30,41,59,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 256, 256);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
      return texture;
    };

    const textureLoader = new THREE.TextureLoader();
    const floorTexture = createProceduralTexture();

    const floorGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
    floorGeo.rotateX(-Math.PI / 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.8,
      metalness: 0.1
    });

    textureLoader.load(
      '/textures/concrete.jpg',
      (loadedTex) => {
        loadedTex.wrapS = THREE.RepeatWrapping;
        loadedTex.wrapT = THREE.RepeatWrapping;
        loadedTex.repeat.set(40, 40);
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

    const fallbackGeo = new THREE.CapsuleGeometry(0.4, 1.3, 8, 16);
    const fallbackMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      metalness: 0.8,
      roughness: 0.2
    });
    const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
    fallbackMesh.position.y = 1.05;
    suitPivot.add(fallbackMesh);

    const reactorGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const reactorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const reactorMesh = new THREE.Mesh(reactorGeo, reactorMat);
    reactorMesh.position.set(0, 1.3, 0.4);
    suitPivot.add(reactorMesh);

    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    setTimeout(() => {
      setIsAssetsLoading(false);
    }, 1800);

    gltfLoader.load(
      '/models/suits/mark3.glb',
      (suitGltf) => {
        suitPivot.remove(fallbackMesh);
        suitPivot.remove(reactorMesh);

        const suitModel = suitGltf.scene;

        suitModel.traverse((child) => {
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

              const boneNames = new Map<string, string>();
              suitModel.traverse((child) => {
                if (child instanceof THREE.Bone) {
                  const clean = child.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  boneNames.set(clean, child.name);
                }
              });

              clip.tracks.forEach((track) => {
                const parts = track.name.split('.');
                const cleanTrack = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                if (boneNames.has(cleanTrack)) {
                  track.name = `${boneNames.get(cleanTrack)}.${parts[1]}`;
                }
              });

              walkAction = mixer.clipAction(clip);
              walkAction.setLoop(THREE.LoopRepeat, Infinity);
            }
            setIsAssetsLoading(false);
          },
          undefined,
          () => {
            setIsAssetsLoading(false);
          }
        );
      },
      undefined,
      () => {
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
    let currentTilt = 0;
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

        const targetTilt = THREE.MathUtils.clamp(-input.x * 0.12, -0.15, 0.15);
        currentTilt = THREE.MathUtils.lerp(currentTilt, targetTilt, delta * 8);

        if (walkAction && !walkAction.isRunning()) {
          walkAction.play();
        }
      } else {
        currentTilt = THREE.MathUtils.lerp(currentTilt, 0, delta * 8);
        if (walkAction && walkAction.isRunning()) {
          walkAction.stop();
        }
      }

      visualModelGroup.rotation.z = currentTilt;

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
