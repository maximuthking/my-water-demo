// --- START OF FILE App.tsx ---

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, Leva } from 'leva';
import LowPolyWater from './LowPolyWater';
import './App.css';

export default function App() {
  const props = useControls({
    // --- 성능 제어를 위한 'detail' 슬라이더 추가 ---
    detail: { value: 30, min: 5, max: 100, step: 1, label: 'Quality / Detail' },
    opacity: { value: 0.8, min: 0, max: 1 },
    wireframe: true,
    waveFrequencyX: { value: 0.5, min: 0, max: 2 },
    waveFrequencyY: { value: 0.3, min: 0, max: 2 },
    waveSpeed: { value: 1.0, min: 0, max: 5 },
    waveAmplitude: { value: 0.1, min: 0, max: 0.3 },
    noiseFrequency: { value: 0.2, min: 0, max: 2, label: 'noise frequency' },
    noiseAmplitude: { value: 0.05, min: 0, max: 0.2, label: 'noise amplitude' },
  });

  return (
    <>
      <Leva theme={{ sizes: { rootWidth: '400px' } }} />
      <Canvas camera={{ position: [0, 15, 15], fov: 60, near: 0.1, far: 1000 }} onCreated={({ camera }) => { camera.lookAt(0, 0, 0); }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <LowPolyWater {...props} />
        <OrbitControls />
      </Canvas>
    </>
  );
}