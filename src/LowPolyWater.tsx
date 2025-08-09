// --- START OF FILE LowPolyWater.tsx ---

import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

// SimplexNoise class (unchanged, code omitted for brevity)
class SimplexNoise {
    p: Uint8Array; perm: Uint8Array; permMod12: Uint8Array;
    constructor(r?:(()=>number)|number|string){let t:()=>number;if(typeof r=="function")t=r;else if(r){let e=r,o=0;t=()=>{o++;const s=Math.sin(o+(e as number))*1e4;return s-Math.floor(s)}}else t=Math.random;this.p=new Uint8Array(256);this.perm=new Uint8Array(512);this.permMod12=new Uint8Array(512);for(let e=0;e<256;e++)this.p[e]=t()*256;for(let e=0;e<512;e++)this.perm[e]=this.p[e&255],this.permMod12[e]=this.perm[e]%12}
    noise3D=(r:number,t:number,e:number)=>{const o=1/3,n=1/6;let l,a,i,c;const h=(r+t+e)*o,d=Math.floor(r+h),p=Math.floor(t+h),m=Math.floor(e+h),g=(d+p+m)*n,u=d-g,f=p-g,b=m-g,w=r-u,x=t-f,y=e-b;let R,A,N,F,z,M;w>=x?(x>=y?(R=1,A=0,N=0,F=1,z=1,M=0):w>=y?(R=1,A=0,N=0,F=1,z=0,M=1):(R=0,A=0,N=1,F=1,z=0,M=1)):x<y?(R=0,A=0,N=1,F=0,z=1,M=1):w<y?(R=0,A=1,N=0,F=0,z=1,M=1):(R=0,A=1,N=0,F=1,z=1,M=0);const L=w-R+n,v=x-A+n,W=y-N+n,_=w-F+2*o,j=x-z+2*o,k=y-M+2*o,q=w-1+3*o,U=x-1+3*o,S=y-1+3*o,D=this.permMod12[d+this.perm[p+this.perm[m]]],O=this.permMod12[d+R+this.perm[p+A+this.perm[m+N]]],E=this.permMod12[d+F+this.perm[p+z+this.perm[m+M]]],T=this.permMod12[d+1+this.perm[p+1+this.perm[m+1]]];let P=0.6-w*w-x*x-y*y;l=P<0?0:P*P*P*P*this.dot(this.grad3[D],w,x,y);let I=0.6-L*L-v*v-W*W;a=I<0?0:I*I*I*I*this.dot(this.grad3[O],L,v,W);let V=0.6-_*_-j*j-k*k;i=V<0?0:V*V*V*V*this.dot(this.grad3[E],_,j,k);let G=0.6-q*q-U*U-S*S;c=G<0?0:G*G*G*G*this.dot(this.grad3[T],q,U,S);return 32*(l+a+i+c)}
    grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    dot=(r:number[],t:number,e:number,o:number)=>r[0]*t+r[1]*e+r[2]*o;
}


interface LowPolyWaterProps {
    detail: number;
    waterOpacity: number; // FIX: Renamed
    foamOpacity: number;  // FIX: Added
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
    
    const noise = useMemo(() => new SimplexNoise(Math.random), []);
    const currentFoamCount = useRef(0);

    const { geometry, faceStates } = useMemo(() => {
        currentFoamCount.current = 0;
        const geo = new THREE.PlaneGeometry(50, 50, detail, detail).toNonIndexed();
        // --- FIX: Use 4 components (RGBA) for the color attribute ---
        geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 4), 4));
        const states = Array(geo.attributes.position.count / 3).fill(0).map(() => ({
            isFoam: false,
            foamAge: 0,
            foamLifespan: 0,
        }));
        return { geometry: geo, faceStates: states };
    }, [detail]);

    const waterColorObj = useMemo(() => new THREE.Color(waterColor), [waterColor]);
    const foamColorObj = useMemo(() => new THREE.Color(foamColor), [foamColor]);

    useFrame(({ clock }, delta) => {
        const t = clock.getElapsedTime();
        const waveTime = t * waveSpeed;
        const pos = geometry.attributes.position;
        const col = geometry.attributes.color as THREE.BufferAttribute;

        // Animate wave vertices (unchanged)
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const baseWave = Math.sin(x*waveFrequencyX + waveTime)*waveAmplitude + Math.cos(y*waveFrequencyY + waveTime*0.7)*waveAmplitude;
            const noiseWave = (noiseFrequency > 0) ? noise.noise3D(x * noiseFrequency, y * noiseFrequency, waveTime * 0.2) * noiseAmplitude : 0;
            pos.setZ(i, baseWave + noiseWave);
        }

        // Manage foam lifecycle and apply colors
        for (let i = 0; i < faceStates.length; i++) {
            const faceState = faceStates[i];
            
            // "Brain" logic (unchanged)
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
            
            // --- The "Brush" ---
            const chosenColor = faceState.isFoam ? foamColorObj : waterColorObj;
            // --- FIX: Get opacity based on state ---
            const chosenOpacity = faceState.isFoam ? foamOpacity : waterOpacity;
            const v1_idx = i * 3, v2_idx = i * 3 + 1, v3_idx = i * 3 + 2;
            
            // --- FIX: Set XYZW to include opacity (Alpha) ---
            col.setXYZW(v1_idx, chosenColor.r, chosenColor.g, chosenColor.b, chosenOpacity);
            col.setXYZW(v2_idx, chosenColor.r, chosenColor.g, chosenColor.b, chosenOpacity);
            col.setXYZW(v3_idx, chosenColor.r, chosenColor.g, chosenColor.b, chosenOpacity);
        }
        
        pos.needsUpdate = true;
        col.needsUpdate = true;
    });

    return (
        <group rotation-x={-Math.PI / 2}>
            <mesh key={geometry.uuid} geometry={geometry}>
                <meshStandardMaterial
                    flatShading
                    transparent // This is crucial for vertex alpha to work
                    // opacity // <<< FIX: Top-level opacity is removed
                    side={THREE.DoubleSide}
                    vertexColors // Tells material to use the color attribute from geometry
                />
            </mesh>
            {wireframe && (
                <mesh key={geometry.uuid + '_wireframe'} geometry={geometry}>
                    <meshBasicMaterial color={wireframeColor} wireframe />
                </mesh>
            )}
        </group>
    );
}