import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ArrowLeft } from 'lucide-react';
import Compass from './Compass';
import Joystick from './Joystick';
import { sound } from '../app/audio';

interface GameScreenProps {
  onBack: () => void;
}

const CHUNK_SIZE = 90;
const ROAD_WIDTH = 14;
const CHUNK_RADIUS = 3;

export default function GameScreen({ onBack }: GameScreenProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const moveVectorRef = useRef({ x: 0, y: 0 });
  const [isAssetsLoading, setIsAssetsLoading] = useState(true);
  const [debugLog, setDebugLog] = useState('Генерация открытого мира...');

  const [hudData, setHudData] = useState({
    rotation: 0,
    playerPos: [0, 0] as [number, number],
  });

  const cameraAnglesRef = useRef({ yaw: 0, pitch: 0.12 });
  const touchRightIdRef = useRef<number | null>(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });

  const spawnPos: [number, number] = [0, 0];
  const questPos: [number, number] = [270, -360];

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.FogExp2(0x7dd3fc, 0.0065);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      900
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    mountRef.current.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    sunLight.position.set(100, 180, 80);
    scene.add(sunLight);

    const skyGeo = new THREE.SphereGeometry(750, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide
    });
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    scene.add(skyDome);

    const makeBuildingFacadeTexture = (baseColor: string, windowColor: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 128, 256);

      const rows = 16;
      const cols = 6;
      const winW = 12;
      const winH = 9;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = 10 + c * 19;
          const y = 8 + r * 15;
          ctx.fillStyle = Math.random() > 0.35 ? windowColor : '#0f172a';
          ctx.fillRect(x, y, winW, winH);
        }
      }

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let r = 0; r < rows; r++) {
        ctx.fillRect(0, r * 15, 128, 2);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    const bldgMats = [
      new THREE.MeshStandardMaterial({
        map: makeBuildingFacadeTexture('#1e293b', '#93c5fd'),
        roughness: 0.5,
        metalness: 0.35
      }),
      new THREE.MeshStandardMaterial({
        map: makeBuildingFacadeTexture('#334155', '#fef08a'),
        roughness: 0.6,
        metalness: 0.25
      }),
      new THREE.MeshStandardMaterial({
        map: makeBuildingFacadeTexture('#0f172a', '#67e8f9'),
        roughness: 0.4,
        metalness: 0.5
      }),
      new THREE.MeshStandardMaterial({
        map: makeBuildingFacadeTexture('#475569', '#bae6fd'),
        roughness: 0.65,
        metalness: 0.2
      })
    ];

    const createCityGroundTexture = (hasPark: boolean) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 512, 512);

      const margin = (ROAD_WIDTH / CHUNK_SIZE) * 512;
      const innerW = 512 - margin;

      ctx.fillStyle = '#64748b';
      ctx.fillRect(margin / 2 - 8, margin / 2 - 8, innerW + 16, innerW + 16);

      ctx.fillStyle = '#334155';
      ctx.fillRect(margin / 2, margin / 2, innerW, innerW);

      if (hasPark) {
        ctx.fillStyle = '#166534';
        const parkInset = 55;
        ctx.fillRect(
          margin / 2 + parkInset,
          margin / 2 + parkInset,
          innerW - parkInset * 2,
          innerW - parkInset * 2
        );

        ctx.fillStyle = '#d97706';
        ctx.fillRect(215, 215, 82, 82);

        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(margin / 2 + parkInset, 246, innerW - parkInset * 2, 20);
        ctx.fillRect(246, margin / 2 + parkInset, 20, innerW - parkInset * 2);
      } else {
        ctx.fillStyle = '#475569';
        const plazaInset = 50;
        ctx.fillRect(
          margin / 2 + plazaInset,
          margin / 2 + plazaInset,
          innerW - plazaInset * 2,
          innerW - plazaInset * 2
        );
      }

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3;
      ctx.setLineDash([14, 14]);

      const halfRoad = margin / 4;
      ctx.beginPath();
      ctx.moveTo(halfRoad, 0);
      ctx.lineTo(halfRoad, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(512 - halfRoad, 0);
      ctx.lineTo(512 - halfRoad, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, halfRoad);
      ctx.lineTo(512, halfRoad);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 512 - halfRoad);
      ctx.lineTo(512, 512 - halfRoad);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';

      const drawZebra = (x: number, y: number, w: number, h: number, horizontal: boolean) => {
        ctx.fillStyle = '#ffffff';
        if (horizontal) {
          for (let i = 0; i < w; i += 12) ctx.fillRect(x + i, y, 7, h);
        } else {
          for (let i = 0; i < h; i += 12) ctx.fillRect(x, y + i, w, 7);
        }
      };

      drawZebra(margin / 2 - 2, 6, 4, margin - 12, false);
      drawZebra(512 - margin / 2 - 2, 6, 4, margin - 12, false);
      drawZebra(6, margin / 2 - 2, margin - 12, 4, true);
      drawZebra(6, 512 - margin / 2 - 2, margin - 12, 4, true);

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    };

    const parkGroundTex = createCityGroundTexture(true);
    const plazaGroundTex = createCityGroundTexture(false);

    const groundGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE);
    groundGeo.rotateX(-Math.PI / 2);

    const parkGroundMat = new THREE.MeshStandardMaterial({ map: parkGroundTex, roughness: 0.9, metalness: 0.05 });
    const plazaGroundMat = new THREE.MeshStandardMaterial({ map: plazaGroundTex, roughness: 0.85, metalness: 0.1 });

    const pseudoRandom = (x: number, z: number, seed: number) => {
      const val = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453;
      return val - Math.floor(val);
    };

    const createChunk = (cx: number, cz: number) => {
      const chunkGroup = new THREE.Group();
      chunkGroup.position.set(cx * CHUNK_SIZE + CHUNK_SIZE / 2, 0, cz * CHUNK_SIZE + CHUNK_SIZE / 2);

      const blockType = Math.floor(pseudoRandom(cx, cz, 1) * 3);
      const isParkBlock = blockType === 0;

      const groundMesh = new THREE.Mesh(groundGeo, isParkBlock ? parkGroundMat : plazaGroundMat);
      chunkGroup.add(groundMesh);

      const innerSize = CHUNK_SIZE - ROAD_WIDTH;
      const halfInner = innerSize / 2;

      if (blockType === 0) {
        const wallThickness = 14;
        const bldgHeightBase = 50 + pseudoRandom(cx, cz, 4) * 45;

        const leftH = bldgHeightBase + (pseudoRandom(cx, cz, 5) > 0.5 ? 15 : 0);
        const leftGeo = new THREE.BoxGeometry(wallThickness, leftH, innerSize);
        const leftMesh = new THREE.Mesh(leftGeo, bldgMats[0]);
        leftMesh.position.set(-halfInner + wallThickness / 2, leftH / 2, 0);
        chunkGroup.add(leftMesh);

        const rightH = bldgHeightBase;
        const rightGeo = new THREE.BoxGeometry(wallThickness, rightH, innerSize);
        const rightMesh = new THREE.Mesh(rightGeo, bldgMats[1]);
        rightMesh.position.set(halfInner - wallThickness / 2, rightH / 2, 0);
        chunkGroup.add(rightMesh);

        const topH = bldgHeightBase + 20;
        const topW = innerSize - wallThickness * 2;
        const topGeo = new THREE.BoxGeometry(topW, topH, wallThickness);
        const topMesh = new THREE.Mesh(topGeo, bldgMats[2]);
        topMesh.position.set(0, topH / 2, -halfInner + wallThickness / 2);
        chunkGroup.add(topMesh);

        const gateW = 16;
        const frontSegmentW = (topW - gateW) / 2;
        const frontH = bldgHeightBase - 10;

        const f1Geo = new THREE.BoxGeometry(frontSegmentW, frontH, wallThickness);
        const f1Mesh = new THREE.Mesh(f1Geo, bldgMats[3]);
        f1Mesh.position.set(-halfInner + wallThickness + frontSegmentW / 2, frontH / 2, halfInner - wallThickness / 2);
        chunkGroup.add(f1Mesh);

        const f2Geo = new THREE.BoxGeometry(frontSegmentW, frontH, wallThickness);
        const f2Mesh = new THREE.Mesh(f2Geo, bldgMats[3]);
        f2Mesh.position.set(halfInner - wallThickness - frontSegmentW / 2, frontH / 2, halfInner - wallThickness / 2);
        chunkGroup.add(f2Mesh);
      } else if (blockType === 1) {
        const towerH = 85 + pseudoRandom(cx, cz, 7) * 40;
        const towerW = 24;

        const t1Geo = new THREE.BoxGeometry(towerW, towerH, towerW);
        const t1Mesh = new THREE.Mesh(t1Geo, bldgMats[2]);
        t1Mesh.position.set(-15, towerH / 2, -15);
        chunkGroup.add(t1Mesh);

        const t2Geo = new THREE.BoxGeometry(towerW, towerH, towerW);
        const t2Mesh = new THREE.Mesh(t2Geo, bldgMats[2]);
        t2Mesh.position.set(15, towerH / 2, 15);
        chunkGroup.add(t2Mesh);

        const sideH = towerH * 0.65;
        const sideGeo = new THREE.BoxGeometry(towerW * 0.9, sideH, towerW * 0.9);
        const sideMesh1 = new THREE.Mesh(sideGeo, bldgMats[0]);
        sideMesh1.position.set(15, sideH / 2, -15);
        chunkGroup.add(sideMesh1);

        const sideMesh2 = new THREE.Mesh(sideGeo, bldgMats[1]);
        sideMesh2.position.set(-15, sideH / 2, 15);
        chunkGroup.add(sideMesh2);

        const spireGeo = new THREE.CylinderGeometry(0.5, 2, 16, 8);
        const spireMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(-15, towerH + 8, -15);
        chunkGroup.add(spire);
      } else {
        const buildingW = (innerSize - 6) / 2;
        const bldgList = [
          { x: -buildingW / 2 - 3, z: -buildingW / 2 - 3, h: 55 + pseudoRandom(cx, cz, 11) * 35 },
          { x: buildingW / 2 + 3, z: -buildingW / 2 - 3, h: 65 + pseudoRandom(cx, cz, 13) * 30 },
          { x: -buildingW / 2 - 3, z: buildingW / 2 + 3, h: 48 + pseudoRandom(cx, cz, 17) * 35 },
          { x: buildingW / 2 + 3, z: buildingW / 2 + 3, h: 75 + pseudoRandom(cx, cz, 19) * 45 },
        ];

        bldgList.forEach((b, idx) => {
          const geo = new THREE.BoxGeometry(buildingW, b.h, buildingW);
          const mesh = new THREE.Mesh(geo, bldgMats[idx % bldgMats.length]);
          mesh.position.set(b.x, b.h / 2, b.z);
          chunkGroup.add(mesh);
        });
      }

      return chunkGroup;
    };

    const chunks = new Map<string, THREE.Group>();

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
            const chunkMesh = createChunk(cx, cz);
            scene.add(chunkMesh);
            chunks.set(key, chunkMesh);
          }
        }
      }

      chunks.forEach((group, key) => {
        if (!activeKeys.has(key)) {
          scene.remove(group);
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

    gltfLoader.load(
      '/models/suits/mark3.glb',
      (suitGltf) => {
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

        if (suitGltf.animations && suitGltf.animations.length > 0) {
          walkAction = mixer.clipAction(suitGltf.animations[0]);
          walkAction.setLoop(THREE.LoopRepeat, Infinity);
          setDebugLog(`GLB: Анимаций (${suitGltf.animations.length}) | Мегаполис готов`);
        } else {
          setDebugLog('Костюм на улицах города');
        }

        setIsAssetsLoading(false);
      },
      undefined,
      () => {
        setDebugLog('Загрузка открытого мира...');
        setIsAssetsLoading(false);
      }
    );

    const beaconGeo = new THREE.CylinderGeometry(0.35, 0.35, 300, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.85 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(questPos[0], 150, questPos[1]);
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

      const targetSpeed = isInputActive ? 10.5 : 0;
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
      const camDist = 3.2;
      const shoulderX = 0.75;
      const shoulderY = 1.85;

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
          0.55
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
