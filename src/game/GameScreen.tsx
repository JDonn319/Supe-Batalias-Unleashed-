import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
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
  const [hudData, setHudData] = useState({
    rotation: 0,
    playerPos: [0, 0] as [number, number],
  });

  const spawnPos: [number, number] = [0, 0];
  const questPos: [number, number] = [160, -220];

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0406);
    scene.fog = new THREE.FogExp2(0x0a0406, 0.016);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(0xffebee, 0x1a0508, 0.7);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 60, 30);
    scene.add(dirLight);

    const textureLoader = new THREE.TextureLoader();
    const concreteTexture = textureLoader.load(
      '/textures/concrete.jpg',
      () => {},
      undefined,
      () => {}
    );
    concreteTexture.wrapS = THREE.RepeatWrapping;
    concreteTexture.wrapT = THREE.RepeatWrapping;
    concreteTexture.repeat.set(4, 4);

    const floorGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
    floorGeo.rotateX(-Math.PI / 2);

    const floorMat = new THREE.MeshStandardMaterial({
      map: concreteTexture,
      color: 0x333333,
      roughness: 0.85,
      metalness: 0.1
    });

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

    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;

    const fallbackGeo = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
    const fallbackMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      metalness: 0.8,
      roughness: 0.3
    });
    const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
    fallbackMesh.position.y = 1.1;
    playerGroup.add(fallbackMesh);

    const reactorGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const reactorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const reactorMesh = new THREE.Mesh(reactorGeo, reactorMat);
    reactorMesh.position.set(0, 1.3, 0.45);
    playerGroup.add(reactorMesh);

    const gltfLoader = new GLTFLoader();
    const fbxLoader = new FBXLoader();

    gltfLoader.load(
      '/models/suits/mark3.glb',
      (suitGltf) => {
        playerGroup.remove(fallbackMesh);
        playerGroup.remove(reactorMesh);
        const suitModel = suitGltf.scene;
        suitModel.scale.set(1.2, 1.2, 1.2);
        playerGroup.add(suitModel);

        mixer = new THREE.AnimationMixer(suitModel);

        fbxLoader.load(
          '/models/animations/walk.fbx',
          (animFbx) => {
            if (animFbx.animations.length > 0 && mixer) {
              const clip = animFbx.animations[0];
              walkAction = mixer.clipAction(clip);
            }
          },
          undefined,
          () => {}
        );
      },
      undefined,
      () => {}
    );

    const questBeaconGeo = new THREE.CylinderGeometry(0.1, 0.1, 100, 8);
    const questBeaconMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.6 });
    const beacon = new THREE.Mesh(questBeaconGeo, questBeaconMat);
    beacon.position.set(questPos[0], 50, questPos[1]);
    scene.add(beacon);

    let lastTime = performance.now();
    let animFrameId: number;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const input = moveVectorRef.current;
      const isMoving = Math.abs(input.x) > 0.05 || Math.abs(input.y) > 0.05;

      if (isMoving) {
        const speed = 12 * delta;
        playerGroup.position.x += input.x * speed;
        playerGroup.position.z += input.y * speed;

        const targetAngle = Math.atan2(input.x, input.y);
        playerGroup.rotation.y = targetAngle;

        if (walkAction && !walkAction.isRunning()) {
          walkAction.play();
        }
      } else {
        if (walkAction && walkAction.isRunning()) {
          walkAction.stop();
        }
      }

      if (mixer) {
        mixer.update(delta);
      }

      camera.position.x = playerGroup.position.x;
      camera.position.y = playerGroup.position.y + 6;
      camera.position.z = playerGroup.position.z + 10;
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.2, playerGroup.position.z);

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
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

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
