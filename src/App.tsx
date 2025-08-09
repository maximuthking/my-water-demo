// --- START OF FILE App.tsx ---

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, Leva, folder } from 'leva';
import LowPolyWater from './LowPolyWater';
import './App.css';
// --- FIX: Separate type imports from value imports ---
import { useRef } from 'react';
import type { MutableRefObject } from 'react';
import { DirectionalLight, Mesh } from 'three';

// This component lives inside the Canvas and can use `useFrame`.
function SunController({ sunAngle, directionalLightRef, sunMeshRef }: {
  sunAngle: number;
  directionalLightRef: MutableRefObject<DirectionalLight>;
  sunMeshRef: MutableRefObject<Mesh>;
}) {
  useFrame(() => {
    // Calculate sun's position on a circular orbit
    const orbitRadius = 20;
    const angleRad = (sunAngle * Math.PI) / 180;
    const x = orbitRadius * Math.cos(angleRad);
    const y = orbitRadius * Math.sin(angleRad);
    const z = 5;

    // Update positions if the refs are attached
    if (sunMeshRef.current) {
        sunMeshRef.current.position.set(x, y, z);
    }
    if (directionalLightRef.current) {
        directionalLightRef.current.position.set(x, y, z);
    }
  });

  return null;
}

export default function App() {
  const props = useControls({
    '조명 & 환경': folder({
      sunAngle: { value: 90, min: 0, max: 180, label: '시간 (각도)' },
      ambientIntensity: { value: 0.3, min: 0, max: 2, label: '주변광 강도'},
    }),
    '파도 & 노이즈': folder({
      waveFrequencyX: { value: 0.5, min: 0, max: 2, label: '파도 주파수 X' },
      waveFrequencyY: { value: 0.3, min: 0, max: 2, label: '파도 주파수 Y' },
      waveSpeed: { value: 1.0, min: 0, max: 5, label: '파도 속도' },
      waveAmplitude: { value: 0.1, min: 0, max: 0.3, label: '파도 진폭' },
      noiseFrequency: { value: 0, min: 0, max: 2, label: '노이즈 주파수' },
      noiseAmplitude: { value: 0.05, min: 0, max: 0.2, label: '노이즈 강도' },
    }),
    '색상 & 거품': folder({
      waterColor: { value: '#3ad5d5', label: "물 색상" },
      foamColor: { value: '#ffffff', label: '거품 색상' },
      waterOpacity: { value: 1.0, min: 0, max: 1, label: '물 투명도' },
      foamOpacity: { value: 1.0, min: 0, max: 1, label: '거품 투명도' },
      maxFoamCount: { value: 50, min: 0, max: 200, step: 1, label: '최대 거품 개수' },
      foamSpawnChance: { value: 0.1, min: 0, max: 1, label: '초당 거품 생성 확률' },
      foamDuration: { value: 2.0, min: 0, max: 10, label: '거품 지속 시간(초)' },
      foamDurationVariance: { value: 1.0, min: 0, max: 5, label: '지속 시간 변화량' },
    }),
    '성능 & 기타': folder({
      detail: { value: 30, min: 5, max: 100, step: 1, label: '품질 / 디테일' },
      wireframe: { value: false, label: '와이어프레임' },
    })
  });

  const directionalLightRef = useRef<DirectionalLight>(null!);
  const sunMeshRef = useRef<Mesh>(null!);

  return (
    <>
      <Leva theme={{ sizes: { rootWidth: '400px' } }} />
      <Canvas camera={{ position: [0, 15, 15], fov: 60 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
        <ambientLight intensity={props.ambientIntensity} />
        
        <directionalLight ref={directionalLightRef} intensity={1} />
        
        <mesh ref={sunMeshRef}>
            <sphereGeometry args={[0.7, 32, 32]} />
            <meshStandardMaterial emissive="yellow" emissiveIntensity={3} color="yellow" />
            <pointLight color="white" intensity={2} distance={20} />
        </mesh>

        <SunController 
          sunAngle={props.sunAngle}
          directionalLightRef={directionalLightRef}
          sunMeshRef={sunMeshRef}
        />

        <LowPolyWater {...props} wireframeColor="black" />
        <OrbitControls />
      </Canvas>
    </>
  );
}