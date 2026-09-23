import * as THREE from 'three';
import { COIN_SETTLE_MS, heldCoinMotion } from './tongbaoMotion.js';

const SECTORS = 320;
const RINGS = 100;
const HOLE = 0.135;
const TAU = Math.PI * 2;
let modelPromise;
const smooth = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const outsideRadius = theta => 1 + Math.sin(theta * 5) * 0.0025 + Math.sin(theta * 19) * 0.001;
const insideRadius = theta => HOLE / Math.max(Math.abs(Math.cos(theta)), Math.abs(Math.sin(theta)));
const luminance = rgb => rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;

// An image-based relief reconstruction, not a dimensional scan. The photograph
// supplies the patina and lettering; geometry supplies the rim and square bore.
function faceHeight(x, y, lightness) {
  const radius = Math.hypot(x, y);
  const square = Math.max(Math.abs(x), Math.abs(y));
  const field = 1 - smooth(0.65, 0.71, radius);
  const lip = (1 - smooth(0.275, 0.31, square)) * smooth(HOLE, HOLE + 0.022, square);
  const lettering = smooth(0.25, 0.64, lightness) * field * smooth(0.29, 0.32, square);
  const rim = smooth(0.934, 0.965, radius) * (1 - smooth(0.982, 1.008, radius));
  return 0.072 - field * 0.01 + lettering * 0.035 + lip * 0.027 + rim * 0.023 + (lightness - 0.5) * 0.003;
}

function meshGeometry(positions, colors, indices) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTongbaoGeometry(sample, reverse = false) {
  const positions = [], colors = [], indices = [];
  const color = new THREE.Color();
  for (let ring = 0; ring <= RINGS; ring += 1) {
    for (let sector = 0; sector <= SECTORS; sector += 1) {
      const theta = sector / SECTORS * TAU;
      const inner = insideRadius(theta);
      const radius = inner + (outsideRadius(theta) - inner) * ring / RINGS;
      const x = Math.cos(theta) * radius, y = Math.sin(theta) * radius;
      const rgb = sample(x, y, reverse);
      const z = faceHeight(x, y, luminance(rgb));
      positions.push(reverse ? -x : x, y, reverse ? -z : z);
      color.setRGB(...rgb, THREE.SRGBColorSpace);
      colors.push(color.r, color.g, color.b);
      if (ring < RINGS && sector < SECTORS) {
        const a = ring * (SECTORS + 1) + sector, b = a + SECTORS + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  return meshGeometry(positions, colors, indices);
}

function createWall(sample, hole) {
  const positions = [], colors = [], indices = [];
  const layers = 10, color = new THREE.Color();
  for (let layer = 0; layer <= layers; layer += 1) {
    const t = layer / layers;
    for (let sector = 0; sector <= SECTORS; sector += 1) {
      const theta = sector / SECTORS * TAU;
      const r = hole ? insideRadius(theta) : outsideRadius(theta);
      const x = r * Math.cos(theta), y = r * Math.sin(theta);
      const top = faceHeight(x, y, luminance(sample(x, y, false)));
      const bottom = -faceHeight(-x, y, luminance(sample(-x, y, true)));
      const bevel = Math.sin(Math.PI * t) * (hole ? -0.009 : 0.0015);
      positions.push(Math.cos(theta) * (r + bevel), Math.sin(theta) * (r + bevel), top + (bottom - top) * t);
      const frontPatina = sample(x * 0.84, y * 0.84, false);
      const backPatina = sample(-x * 0.84, y * 0.84, true);
      const wear = 0.88 + 0.012 * Math.sin(theta * 97) + 0.008 * Math.sin(theta * 23);
      const edgeColor = frontPatina.map((value, channel) => (value * (1 - t) + backPatina[channel] * t) * wear);
      color.setRGB(...edgeColor, THREE.SRGBColorSpace);
      colors.push(color.r, color.g, color.b);
      if (layer < layers && sector < SECTORS) {
        const a = layer * (SECTORS + 1) + sector, b = a + SECTORS + 1;
        if (hole) indices.push(a, a + 1, b, b, a + 1, b + 1);
        else indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  return meshGeometry(positions, colors, indices);
}

function loadModel() {
  if (!modelPromise) {
    modelPromise = new Promise((resolve, reject) => {
      const photo = new Image();
      photo.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = photo.width;
          canvas.height = photo.height;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(photo, 0, 0);
          const { data } = context.getImageData(0, 0, photo.width, photo.height);
          const sample = (x, y, reverse) => {
            const px = Math.max(0, Math.min(photo.width - 2, (reverse ? 352 : 119) + x * 101));
            const py = Math.max(0, Math.min(photo.height - 2, 112 - y * 101));
            const ix = Math.floor(px), iy = Math.floor(py), tx = px - ix, ty = py - iy;
            return [0, 1, 2].map(channel => {
              const at = (dx, dy) => data[((iy + dy) * photo.width + ix + dx) * 4 + channel];
              return ((at(0, 0) * (1 - tx) + at(1, 0) * tx) * (1 - ty)
                + (at(0, 1) * (1 - tx) + at(1, 1) * tx) * ty) / 255;
            });
          };
          resolve([createTongbaoGeometry(sample), createTongbaoGeometry(sample, true), createWall(sample, false), createWall(sample, true)]);
        } catch (error) { reject(error); }
      };
      photo.onerror = reject;
      photo.src = '/tongbao-reference.jpeg';
    }).catch(error => { modelPromise = null; throw error; });
  }
  return modelPromise;
}

function studioEnvironment(renderer) {
  // Broad reflections reveal the metal relief. There is no ground or cast shadow.
  const width = 128, height = 64, pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width, v = y / height;
      const softbox = (cx, cy, sx, sy) => Math.exp(-(((u - cx) / sx) ** 2) - ((v - cy) / sy) ** 2);
      const light = 0.65 + 1.6 * softbox(0.2, 0.35, 0.12, 0.23)
        + 1.2 * softbox(0.72, 0.45, 0.16, 0.3) + 0.7 * softbox(0.48, 0.12, 0.4, 0.13);
      pixels.set([light, light * 0.96, light * 0.89, 1], (y * width + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromEquirectangular(texture);
  texture.dispose();
  generator.dispose();
  return target;
}

export async function createTongbaoRenderer(canvas) {
  const geometries = await loadModel();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.12, 1.12, 1.12, -1.12, 0.1, 20);
  camera.position.z = 5;
  const environment = studioEnvironment(renderer);
  scene.environment = environment.texture;
  const faceMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.68, roughness: 0.7 });
  const edgeMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.74, roughness: 0.64 });
  const coin = new THREE.Group();
  geometries.forEach((geometry, index) => coin.add(new THREE.Mesh(geometry, index < 2 ? faceMaterial : edgeMaterial)));
  scene.add(coin);
  scene.add(new THREE.HemisphereLight(0xfff7e5, 0xc2b8a3, 1.35));
  const key = new THREE.DirectionalLight(0xfff3d8, 2.4);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xf0f4ff, 1.3);
  fill.position.set(4, 1, -5);
  scene.add(fill);
  let frame = 0, currentAngle = 0, targetAngle = 0, disposed = false, holding = false, currentSpeed = 0;
  const paint = angle => {
    currentAngle = angle;
    coin.rotation.set(-0.16, angle * Math.PI / 180 + 0.3, 0.015, 'YXZ');
    renderer.render(scene, camera);
  };
  const resize = () => {
    if (disposed) return;
    const size = Math.max(1, canvas.parentElement?.clientWidth || 150);
    renderer.setSize(size, size, false);
    paint(currentAngle);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  return {
    turn(angle, duration, snap = false, spinning = false) {
      if (disposed) return;
      if (spinning && holding) return;
      if (!spinning && !holding && angle === targetAngle && !snap) return;
      cancelAnimationFrame(frame);
      const wasHolding = holding;
      holding = spinning;
      const logicalDelta = angle - targetAngle;
      targetAngle = angle;
      const from = currentAngle;
      if (snap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { paint(angle); return; }
      const started = performance.now();
      if (spinning) {
        const spin = now => {
          const motion = heldCoinMotion(now - started);
          currentSpeed = motion.speed;
          paint(from + motion.angle);
          frame = requestAnimationFrame(spin);
        };
        frame = requestAnimationFrame(spin);
        return;
      }
      const initialVelocity = currentSpeed * COIN_SETTLE_MS;
      const extraTurn = wasHolding ? Math.max(120, initialVelocity / 3) : Math.max(1, Math.floor(logicalDelta / 360)) * 360;
      const destination = from + extraTurn + ((angle - from - extraTurn) % 360 + 360) % 360;
      const stopDuration = wasHolding ? COIN_SETTLE_MS : duration;
      const animate = now => {
        const progress = Math.min(1, (now - started) / stopDuration);
        // Quintic ease-out decreases angular velocity continuously to zero.
        const delta = wasHolding
          ? (progress ** 3 - 2 * progress ** 2 + progress) * initialVelocity
            + (-2 * progress ** 3 + 3 * progress ** 2) * (destination - from)
          : (destination - from) * (1 - (1 - progress) ** 5);
        paint(from + delta);
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      faceMaterial.dispose();
      edgeMaterial.dispose();
      environment.dispose();
      // Geometry is shared by the three coins and retained for page re-entry.
      renderer.dispose();
      renderer.forceContextLoss();
    }
  };
}
