// public/water-worker.js

// --- FIX: Use the full, correct SimplexNoise class definition ---
class SimplexNoise {
    constructor(randomOrSeed) {
        let random;
        if (typeof randomOrSeed === 'function') {
            random = randomOrSeed;
        } else if (randomOrSeed) {
            let i = 0;
            random = () => {
                const x = Math.sin(i++ + randomOrSeed) * 10000;
                return x - Math.floor(x);
            };
        } else {
            random = Math.random;
        }

        this.p = new Uint8Array(256);
        for(let i=0; i<256; i++) this.p[i] = i;
        
        let n = 256;
        let p = this.p;
        while(n--) {
            let k = Math.floor(random() * (n + 1));
            let t = p[n];
            p[n] = p[k];
            p[k] = t;
        }

        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        for(let i=0; i<512; i++) {
            this.perm[i] = p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }

        this.grad3 = [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ];
    }

    dot(g, x, y, z) {
        return g[0]*x + g[1]*y + g[2]*z;
    }

    noise3D(xin, yin, zin) {
        const F3 = 1.0/3.0;
        const G3 = 1.0/6.0;
        let n0, n1, n2, n3;
        const s = (xin + yin + zin) * F3;
        const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
        const t = (i + j + k) * G3;
        const X0 = i - t, Y0 = j - t, Z0 = k - t;
        const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0;

        let i1, j1, k1, i2, j2, k2;
        if (x0 >= y0) {
            if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
            else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
            else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
        } else {
            if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
            else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
            else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
        }

        const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2.0 * G3, y2 = y0 - j2 + 2.0 * G3, z2 = z0 - k2 + 2.0 * G3;
        const x3 = x0 - 1.0 + 3.0 * G3, y3 = y0 - 1.0 + 3.0 * G3, z3 = z0 - 1.0 + 3.0 * G3;
        const gi0 = this.permMod12[i + this.perm[j + this.perm[k]]];
        const gi1 = this.permMod12[i + i1 + this.perm[j + j1 + this.perm[k + k1]]];
        const gi2 = this.permMod12[i + i2 + this.perm[j + j2 + this.perm[k + k2]]];
        const gi3 = this.permMod12[i + 1 + this.perm[j + 1 + this.perm[k + 1]]];
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        n0 = (t0 < 0) ? 0.0 : t0 * t0 * t0 * t0 * this.dot(this.grad3[gi0], x0, y0, z0);
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        n1 = (t1 < 0) ? 0.0 : t1 * t1 * t1 * t1 * this.dot(this.grad3[gi1], x1, y1, z1);
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        n2 = (t2 < 0) ? 0.0 : t2 * t2 * t2 * t2 * this.dot(this.grad3[gi2], x2, y2, z2);
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        n3 = (t3 < 0) ? 0.0 : t3 * t3 * t3 * t3 * this.dot(this.grad3[gi3], x3, y3, z3);
        return 32.0 * (n0 + n1 + n2 + n3);
    }
}


const noise = new SimplexNoise(Math.random());

self.onmessage = (e) => {
    const {
        waveTime, originalPositions,
        waveFrequencyX, waveFrequencyY, waveAmplitude,
        noiseFrequency, noiseAmplitude
    } = e.data;

    const newPositions = new Float32Array(originalPositions);

    for (let i = 0; i < newPositions.length / 3; i++) {
        const i3 = i * 3;
        const x = originalPositions[i3];
        const y = originalPositions[i3 + 1];

        const baseWave = Math.sin(x * waveFrequencyX + waveTime) * waveAmplitude + Math.cos(y * waveFrequencyY + waveTime * 0.7) * waveAmplitude + Math.sin((x + y) * 0.1 + waveTime * 0.3) * waveAmplitude * 0.5;
        const noiseWave = (noiseFrequency > 0) ? noise.noise3D(x * noiseFrequency, y * noiseFrequency, waveTime * 0.2) * noiseAmplitude : 0;

        newPositions[i3 + 2] = baseWave + noiseWave;
    }

    self.postMessage(newPositions, [newPositions.buffer]);
};