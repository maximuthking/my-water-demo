// --- START OF FILE App.tsx ---

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControls, Leva, folder } from 'leva';
import LowPolyWater from './LowPolyWater';
import './App.css';
// --- FIX: 불필요한 import들을 모두 정리합니다. ---
// useRef, MutableRefObject, DirectionalLight, Mesh 등은 더 이상 필요 없습니다.

export default function App() {
  const props = useControls({
    // --- FIX: '태양' 그룹을 제거하고 '환경 설정'으로 단순화합니다. ---
    '환경 설정': folder({
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
  
  // --- FIX: useRef와 SunController 로직을 모두 삭제합니다. ---

  return (
    <>
      <Leva theme={{ sizes: { rootWidth: '400px' } }} />
      <Canvas camera={{ position: [0, 15, 15], fov: 60 }} onCreated={({ camera }) => camera.lookAt(0, 0, 0)}>
        <ambientLight intensity={props.ambientIntensity} />
        
        {/* --- FIX: 원래의 고정된 위치를 가진 DirectionalLight로 되돌립니다. --- */}
        <directionalLight position={[5, 10, 5]} intensity={1} />
        
        {/* --- FIX: 태양 메시(mesh)를 삭제합니다. --- */}

        {/* --- FIX: SunController 컴포넌트를 삭제합니다. --- */}

        <LowPolyWater {...props} wireframeColor="black" />
        <OrbitControls />
      </Canvas>
    </>
  );
}