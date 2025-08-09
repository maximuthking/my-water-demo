// --- START OF FILE LowPolyWater.tsx ---

import * as THREE from 'three';
import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

interface LowPolyWaterProps {
    detail: number;
    waterOpacity: number;
    foamOpacity: number;
    waterColor: string;
    foamColor: string;
    maxFoamCount: number;
    foamSpawnChance: number;
    foamDuration: number;
    foamDurationVariance: number;
    wireframe: boolean;
    wireframeColor: string;
    waveFrequencyX: number;
    waveFrequencyY: number;
    waveSpeed: number;
    waveAmplitude: number;
    noiseFrequency: number;
    noiseAmplitude: number;
}

export default function LowPolyWater({
    detail, waterOpacity, foamOpacity,
    waterColor, foamColor,
    maxFoamCount, foamSpawnChance, foamDuration, foamDurationVariance,
    wireframe, wireframeColor,
    waveFrequencyX, waveFrequencyY, waveSpeed, waveAmplitude,
    noiseFrequency, noiseAmplitude,
}: LowPolyWaterProps) {
    
    const currentFoamCount = useRef(0);
    // --- FIX: useRef에 초기값 `null`을 명시적으로 전달합니다. ---
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);

    const { faceStates, originalPositions } = useMemo(() => {
        currentFoamCount.current = 0;
        const geo = new THREE.PlaneGeometry(50, 50, detail, detail).toNonIndexed();
        geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 4), 4));
        const states = Array(geo.attributes.position.count / 3).fill(0).map(() => ({
            isFoam: false,
            foamAge: 0,
            foamLifespan: 0,
        }));
        const origPos = geo.attributes.position.array.slice();
        
        geometryRef.current = geo;
        return { faceStates: states, originalPositions: origPos };
    }, [detail]);

    const waterColorObj = useMemo(() => new THREE.Color(waterColor), [waterColor]);
    const foamColorObj = useMemo(() => new THREE.Color(foamColor), [foamColor]);

    // --- FIX: useRef에 초기값 `null`을 명시적으로 전달합니다. ---
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        workerRef.current = new Worker('/water-worker.js');

        workerRef.current.onmessage = (e) => {
            const newPositions = e.data;
            if (geometryRef.current) {
                geometryRef.current.attributes.position.array.set(newPositions);
                geometryRef.current.attributes.position.needsUpdate = true;
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useFrame(({ clock }, delta) => {
        if (!geometryRef.current) return;

        const t = clock.getElapsedTime();
        const col = geometryRef.current.attributes.color as THREE.BufferAttribute;

        for (let i = 0; i < faceStates.length; i++) {
            const faceState = faceStates[i];
            if (faceState.isFoam) {
                if (t - faceState.foamAge > faceState.foamLifespan) {
                    faceState.isFoam = false;
                    currentFoamCount.current--;
                }
            } else {
                if (currentFoamCount.current < maxFoamCount) {
                    if (Math.random() < foamSpawnChance * delta) {
                        faceState.isFoam = true;
                        faceState.foamAge = t;
                        faceState.foamLifespan = foamDuration + (Math.random() - 0.5) * foamDurationVariance;
                        currentFoamCount.current++;
                    }
                }
            }
            const chosenColor = faceState.isFoam ? foamColorObj : waterColorObj;
            const chosenOpacity = faceState.isFoam ? foamOpacity : waterOpacity;
            const v1_idx = i * 3, v2_idx = i * 3 + 1, v3_idx = i * 3 + 2;
            col.setXYZW(v1_idx, chosenColor.r, chosenColor.g, chosenColor.b, chosenOpacity);
            col.setXYZW(v2_idx, chosenColor.r, chosenColor.g, chosenColor.b, chosenOpacity);
            col.setXYZW(v3_idx, chosenColor.r, chosenColor.g, chosenColor.b, chosenOpacity);
        }
        col.needsUpdate = true;
        
        if (workerRef.current) {
            workerRef.current.postMessage({
                t, waveTime: t * waveSpeed,
                originalPositions,
                waveFrequencyX, waveFrequencyY, waveAmplitude,
                noiseFrequency, noiseAmplitude
            });
        }
    });

    return (
        <group rotation-x={-Math.PI / 2}>
            <mesh key={detail} geometry={geometryRef.current ?? undefined}>
                <meshStandardMaterial
                    flatShading
                    transparent
                    side={THREE.DoubleSide}
                    vertexColors
                />
            </mesh>
            {wireframe && (
                <mesh key={detail + '_wireframe'} geometry={geometryRef.current ?? undefined}>
                    <meshBasicMaterial color={wireframeColor} wireframe />
                </mesh>
            )}
        </group>
    );
}