/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Compass, 
  Upload, 
  RotateCcw, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Sliders, 
  HelpCircle,
  Eye,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
  Camera,
  Download,
  Trash2,
  CameraOff,
  Focus,
  Check,
  X,
  Layers,
  Film
} from 'lucide-react';
import { ThemeMode } from '../types';

interface PanoramaViewerProps {
  theme: ThemeMode;
  uploadedSrc: string | null;
  renderedSrc: string | null;
}

// Procedural panoramic texture generator to support instant testing out-of-the-box
function generateProceduralPanorama(type: 'cyber' | 'nebula' | 'studio', theme: ThemeMode): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const w = canvas.width;
  const h = canvas.height;

  if (type === 'cyber') {
    // 1. Futuristic Cyberpunk Grid
    ctx.fillStyle = '#06050b';
    ctx.fillRect(0, 0, w, h);

    // Dynamic grid glow background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#020005');
    bgGrad.addColorStop(0.5, '#0d0422');
    bgGrad.addColorStop(1, '#020005');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw coordinate space stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 180; i++) {
       const x = Math.random() * w;
       const y = Math.random() * h;
       const size = Math.random() * 1.5;
       ctx.globalAlpha = Math.random() * 0.8 + 0.2;
       ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1.0;

    // Grid lines - longitude
    ctx.lineWidth = 1;
    for (let i = 0; i < 24; i++) {
      const x = (w * i) / 24;
      ctx.strokeStyle = i % 6 === 0 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(139, 92, 246, 0.15)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Grid lines - latitude
    for (let i = 1; i < 12; i++) {
      const y = (h * i) / 12;
      ctx.strokeStyle = i === 6 ? 'rgba(236, 72, 153, 0.5)' : 'rgba(139, 92, 246, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Equator Line glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ec4899';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset glow

    // Compass headings text in space
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const headings = [
      { name: 'N 北 (0°)', x: w * 0.5 },
      { name: 'E 东 (90°)', x: w * 0.75 },
      { name: 'S 南 (180°)', x: w * 0.0 }, // wrap around Left/Right
      { name: 'S 南 (180°)', x: w },
      { name: 'W 西 (270°)', x: w * 0.25 }
    ];

    headings.forEach(hItem => {
      // Glow text
      ctx.fillStyle = '#22d3ee';
      ctx.fillText(hItem.name, hItem.x, h / 2 - 20);
      ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.fillText(hItem.name, hItem.x, h / 2 - 20);
    });

    // Elegant metadata overlays
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px font-mono, monospace';
    ctx.fillText('ZENITH (天顶 +90°)', w / 2, 40);
    ctx.fillText('NADIR (天底 -90°)', w / 2, h - 40);

  } else if (type === 'nebula') {
    // 2. Deep Space Nebula Galaxy
    ctx.fillStyle = '#020206';
    ctx.fillRect(0, 0, w, h);

    // Draw nebula clouds with screen blending
    ctx.globalCompositeOperation = 'screen';
    
    // Draw some colorful blurry cosmic clouds
    const colors = [
      { col: 'rgba(139, 92, 246, 0.18)', x: w * 0.3, y: h * 0.4, r: 250 },
      { col: 'rgba(236, 72, 153, 0.15)', x: w * 0.6, y: h * 0.5, r: 280 },
      { col: 'rgba(34, 211, 238, 0.12)', x: w * 0.45, y: h * 0.6, r: 220 },
      { col: 'rgba(245, 158, 11, 0.1)', x: w * 0.8, y: h * 0.3, r: 200 }
    ];

    colors.forEach(cloud => {
      const grad = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
      grad.addColorStop(0, cloud.col);
      grad.addColorStop(0.5, cloud.col.replace('0.1', '0.04'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';

    // Dense scattered stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 350; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const isLarge = Math.random() > 0.95;
      const radius = isLarge ? Math.random() * 1.5 + 0.8 : Math.random() * 0.8 + 0.2;
      
      ctx.globalAlpha = Math.random() * 0.85 + 0.15;
      
      // Star color variation
      const roll = Math.random();
      if (roll > 0.9) {
        ctx.fillStyle = '#93c5fd'; // Soft blue star
      } else if (roll > 0.8) {
        ctx.fillStyle = '#fbcfe8'; // Soft pink star
      } else {
        ctx.fillStyle = '#ffffff';
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Horizon coordinates indicator (minimal)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0° COMPASS HEADING', w / 2, h / 2 + 15);

  } else {
    // 3. Minimal Studio Sphere (Photography Light stage)
    const isLight = theme === 'light';
    ctx.fillStyle = isLight ? '#f1f5f9' : '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Soft gradient horizon shading
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (isLight) {
      skyGrad.addColorStop(0, '#f8fafc');
      skyGrad.addColorStop(0.48, '#e2e8f0');
      skyGrad.addColorStop(0.52, '#cbd5e1');
      skyGrad.addColorStop(1, '#94a3b8');
    } else {
      skyGrad.addColorStop(0, '#1e293b');
      skyGrad.addColorStop(0.48, '#0f172a');
      skyGrad.addColorStop(0.52, '#090d16');
      skyGrad.addColorStop(1, '#020408');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Soft Studio Spotlight
    ctx.globalCompositeOperation = 'screen';
    const spotX = w * 0.5;
    const spotY = h * 0.2;
    const spotGrad = ctx.createRadialGradient(spotX, spotY, 5, spotX, spotY, 300);
    spotGrad.addColorStop(0, isLight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)');
    spotGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = spotGrad;
    ctx.beginPath();
    ctx.arc(spotX, spotY, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Compass grids (very subtle studio layout)
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 8; i++) {
      const x = (w * i) / 8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
    ctx.font = 'semibold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STUDIO STAGE 360°', w / 2, h / 2 - 10);
  }

  return canvas.toDataURL('image/png');
}

interface CapturedViewpoint {
  id: string;
  image: string; // EXIF postcard dataUrl
  rawImage: string; // blurred shot dataUrl
  lon: number;
  lat: number;
  heading: string;
  fov: number;
  lensType: string;
  focalLength: number;
  aperture: number;
  blurType: 'none' | 'radial' | 'tilt-shift';
  distortion?: number; // Lens distortion correction amount
  timestamp: string;
  title: string;
}

const LENS_PRESETS = [
  { mm: 8, fov: 120, name: '🎥 8mm 电影超级鱼眼 (Fisheye)', label: '8mm' },
  { mm: 14, fov: 104, name: '🏞️ 14mm 超广角风景镜 (Ultra-Wide)', label: '14mm' },
  { mm: 24, fov: 84, name: '🏙️ 24mm 空间街拍广角 (Wide)', label: '24mm' },
  { mm: 35, fov: 63, name: '🚶🏻‍♂️ 35mm 黄金纪实镜 (Street Classic)', label: '35mm' },
  { mm: 50, fov: 46, name: '👁️ 50mm 人眼标准平视 (Standard)', label: '50mm' },
  { mm: 85, fov: 28, name: '👩🏻 85mm 肖像特写黄金 (Golden Portrait)', label: '85mm' },
  { mm: 135, fov: 18, name: '🏃🏻‍♂️ 135mm 远摄体育特写 (Sports Detail)', label: '135mm' },
  { mm: 200, fov: 12, name: '🦅 200mm 运动打鸟望远 (Super Tele)', label: '200mm' }
];

// Calculate camera FOV from focal length
const focalLengthToFov = (flValue: number): number => {
  const fovVal = 2 * Math.atan(18 / flValue) * (180 / Math.PI);
  return Math.round(fovVal);
};

// Calculate focal length from camera FOV
const fovToFocalLength = (fovVal: number): number => {
  return Math.max(8, Math.min(200, Math.round(18 / Math.tan((fovVal / 2) * (Math.PI / 180)))));
};

export default function PanoramaViewer({
  theme,
  uploadedSrc,
  renderedSrc
}: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States
  const [activeSource, setActiveSource] = useState<'preset_cyber' | 'preset_nebula' | 'preset_studio' | 'uploaded' | 'rendered'>('preset_cyber');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState<number>(1.0); // 0.5 to 3
  const [isVerticalLocked, setIsVerticalLocked] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Snapshot/Perspective Studio States
  const [snapshots, setSnapshots] = useState<CapturedViewpoint[]>([]);
  const [selectedPreviewSnapshot, setSelectedPreviewSnapshot] = useState<CapturedViewpoint | null>(null);
  const [selectedLens, setSelectedLens] = useState<number>(50); // initial 50mm
  const [selectedAperture, setSelectedAperture] = useState<number>(1.8);
  const [blurType, setBlurType] = useState<'none' | 'radial' | 'tilt-shift'>('radial');
  const [distortion, setDistortion] = useState<number>(0.0); // -0.3 to 0.3 factor
  const [enableWatermark, setEnableWatermark] = useState<boolean>(true);
  const [showCalibGrid, setShowCalibGrid] = useState<boolean>(true);
  const [snapshotTitle, setSnapshotTitle] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Reference to 3D engine elements for manual camera movement/rendering outside loop
  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
  } | null>(null);
  
  // HUD Readouts state
  const [hudOrientation, setHudOrientation] = useState({ lon: 0, lat: 0, heading: 'N' });
  const [hudFov, setHudFov] = useState<number>(75);
  const [imgError, setImgError] = useState<string | null>(null);

  // References for render loop (avoids stale closures)
  const renderStateRef = useRef({
    lon: 180, // Start looking forward
    lat: 0,
    fov: 75,
    isDragging: false,
    startX: 0,
    startY: 0,
    startLon: 180,
    startLat: 0,
    targetLon: 180,
    targetLat: 0,
    autoRotate: true,
    autoRotateSpeed: 1.0,
    isVerticalLocked: false,
    isCapturing: false,
    imageSrc: '',
    needsTextureLoad: false
  });

  // Keep ref synchronized from component states
  useEffect(() => {
    renderStateRef.current.autoRotate = autoRotate;
    renderStateRef.current.autoRotateSpeed = autoRotateSpeed;
    renderStateRef.current.isVerticalLocked = isVerticalLocked;
    renderStateRef.current.isCapturing = isCapturing;
  }, [autoRotate, autoRotateSpeed, isVerticalLocked, isCapturing]);

  // Determine active source image string
  let currentImageSrc = '';
  if (activeSource === 'preset_cyber') {
    currentImageSrc = generateProceduralPanorama('cyber', theme);
  } else if (activeSource === 'preset_nebula') {
    currentImageSrc = generateProceduralPanorama('nebula', theme);
  } else if (activeSource === 'preset_studio') {
    currentImageSrc = generateProceduralPanorama('studio', theme);
  } else if (activeSource === 'uploaded') {
    currentImageSrc = uploadedSrc || '';
  } else if (activeSource === 'rendered') {
    currentImageSrc = renderedSrc || '';
  }

  // Trigger reloading of texture when image source alters
  useEffect(() => {
    if (currentImageSrc) {
      renderStateRef.current.imageSrc = currentImageSrc;
      renderStateRef.current.needsTextureLoad = true;
      setImgError(null);
    } else {
      // Fallback if requested custom source but its null
      if (activeSource === 'uploaded' && !uploadedSrc) {
        setActiveSource('preset_cyber');
      } else if (activeSource === 'rendered' && !renderedSrc) {
        setActiveSource('preset_cyber');
      }
    }
  }, [activeSource, currentImageSrc, uploadedSrc, renderedSrc]);

  // Main Three.JS Panorama Engine initialization
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 400;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Perspective Camera on the INSIDE of the sphere
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    // Camera is strictly at the center (0,0,0) to inspect surrounding equirectangular walls
    camera.position.set(0, 0, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Expose engine pieces to component ref for snapshots
    engineRef.current = { renderer, scene, camera };

    // 4. Large inner sphere geometry
    const sphereGeo = new THREE.SphereGeometry(500, 60, 40);
    // Invert the geometry on the X axis so that the face normals point inward
    sphereGeo.scale(-1, 1, 1);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    let currentTexture: THREE.Texture | null = null;

    // Create Mesh with a temporary basic color material
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x111827
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // Function to download/apply actual panorama mapping
    const applyTexture = (src: string) => {
      if (!src) return;
      textureLoader.load(
        src,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;

          // Dispose of previous map to make memory efficient
          if (sphereMat.map) {
            sphereMat.map.dispose();
          }

          sphereMat.color.setHex(0xffffff); // reset back to standard white so tint is original
          sphereMat.map = texture;
          sphereMat.needsUpdate = true;
          currentTexture = texture;
        },
        undefined,
        (err) => {
          console.error('[PANORAMA ENGINE] Failed load texture:', err);
          setImgError('抱歉，由于部分浏览器跨域限制或图像资源尺寸过大，无法加载此全景照片。');
        }
      );
    };

    // Load initial source
    if (renderStateRef.current.imageSrc) {
      applyTexture(renderStateRef.current.imageSrc);
    }

    // 5. Setup event controls (Drag look-around)
    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      renderStateRef.current.isDragging = true;
      renderStateRef.current.startX = e.clientX;
      renderStateRef.current.startY = e.clientY;
      renderStateRef.current.startLon = renderStateRef.current.lon;
      renderStateRef.current.startLat = renderStateRef.current.lat;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!renderStateRef.current.isDragging) return;

      const deltaX = e.clientX - renderStateRef.current.startX;
      const deltaY = e.clientY - renderStateRef.current.startY;

      // Sensitivity factor
      const zoomFactor = renderStateRef.current.fov / 75;
      const factor = 0.15 * zoomFactor;

      renderStateRef.current.targetLon = renderStateRef.current.startLon - deltaX * factor;
      if (!renderStateRef.current.isVerticalLocked) {
        renderStateRef.current.targetLat = renderStateRef.current.startLat + deltaY * factor;
      }
    };

    const onMouseUp = () => {
      renderStateRef.current.isDragging = false;
    };

    // Touch support for mobiles/iFrames
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      renderStateRef.current.isDragging = true;
      renderStateRef.current.startX = e.touches[0].clientX;
      renderStateRef.current.startY = e.touches[0].clientY;
      renderStateRef.current.startLon = renderStateRef.current.lon;
      renderStateRef.current.startLat = renderStateRef.current.lat;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!renderStateRef.current.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - renderStateRef.current.startX;
      const deltaY = e.touches[0].clientY - renderStateRef.current.startY;
      
      const zoomFactor = renderStateRef.current.fov / 75;
      const factor = 0.2 * zoomFactor;

      renderStateRef.current.targetLon = renderStateRef.current.startLon - deltaX * factor;
      if (!renderStateRef.current.isVerticalLocked) {
        renderStateRef.current.targetLat = renderStateRef.current.startLat + deltaY * factor;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Adjust camera FOV based on zoom
      let dFov = renderStateRef.current.fov + e.deltaY * 0.05;
      dFov = Math.max(30, Math.min(110, dFov)); // Limit FOV zoom bounds
      renderStateRef.current.fov = dFov;
      setHudFov(Math.round(dFov));
    };

    // Attach listeners
    const canvasEl = canvasRef.current;
    canvasEl.addEventListener('mousedown', onMouseDown);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('touchstart', onTouchStart, { passive: true });
    canvasEl.addEventListener('touchmove', onTouchMove, { passive: true });
    canvasEl.addEventListener('touchend', onMouseUp);
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 6. Handle container Resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: currentW, height: currentH } = entries[0].contentRect;
      if (currentW > 0 && currentH > 0) {
        camera.aspect = currentW / currentH;
        camera.updateProjectionMatrix();
        renderer.setSize(currentW, currentH);
      }
    });
    resizeObserver.observe(containerRef.current);

    // 7. Render/Animation loop
    let animationFrameId: number;
    let runLoop = true;
    let frameCounter = 0;

    const animate = () => {
      if (!runLoop) return;
      animationFrameId = requestAnimationFrame(animate);

      const state = renderStateRef.current;

      // Check if external trigger requested quick load of a new texture URL
      if (state.needsTextureLoad) {
        applyTexture(state.imageSrc);
        state.needsTextureLoad = false;
      }

      // Auto rotation in Azimuth (Longitude)
      if (state.autoRotate && !state.isDragging && !state.isCapturing) {
        // Slowly increase target longitude
        state.targetLon += 0.04 * state.autoRotateSpeed;
      }

      // Clamping limits
      state.targetLat = Math.max(-85, Math.min(85, state.targetLat));

      // Smoothly update camera coordinates using buttery linear interpolation (lerp)
      state.lon += (state.targetLon - state.lon) * 0.1;
      state.lat += (state.targetLat - state.lat) * 0.1;

      // Spherical projection conversion
      const phi = THREE.MathUtils.degToRad(90 - state.lat);
      const theta = THREE.MathUtils.degToRad(state.lon);

      // Sphere coordinates relative mapping (Y is UP)
      const lookX = 500 * Math.sin(phi) * Math.sin(theta);
      const lookY = 500 * Math.cos(phi);
      const lookZ = 500 * Math.sin(phi) * Math.cos(theta);

      camera.lookAt(new THREE.Vector3(lookX, lookY, lookZ));

      // React to dynamic FOV zooming updates inside loop
      if (camera.fov !== state.fov) {
        camera.fov = state.fov;
        camera.updateProjectionMatrix();
      }

      // Render scene
      renderer.render(scene, camera);

      // Throttled HUD update for premium feeling
      frameCounter++;
      if (frameCounter % 10 === 0) {
        // Horizontal angle in Degrees modulo to [0-360]
        let positiveLon = Math.round(state.lon) % 360;
        if (positiveLon < 0) positiveLon += 360;
        
        // Map to Cardinal letters
        let headingText = 'N';
        if (positiveLon >= 22.5 && positiveLon < 67.5) headingText = 'NE';
        else if (positiveLon >= 67.5 && positiveLon < 112.5) headingText = 'E';
        else if (positiveLon >= 112.5 && positiveLon < 157.5) headingText = 'SE';
        else if (positiveLon >= 157.5 && positiveLon < 202.5) headingText = 'S';
        else if (positiveLon >= 202.5 && positiveLon < 247.5) headingText = 'SW';
        else if (positiveLon >= 247.5 && positiveLon < 292.5) headingText = 'W';
        else if (positiveLon >= 292.5 && positiveLon < 337.5) headingText = 'NW';

        setHudOrientation({
          lon: Math.round(state.lon % 360),
          lat: Math.round(state.lat),
          heading: headingText
        });
      }
    };

    animate();

    // 8. Cleanup code
    return () => {
      runLoop = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      engineRef.current = null;
      
      canvasEl.removeEventListener('mousedown', onMouseDown);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('touchstart', onTouchStart);
      canvasEl.removeEventListener('touchmove', onTouchMove);
      canvasEl.removeEventListener('touchend', onMouseUp);

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      sphereGeo.dispose();
      sphereMat.dispose();
      if (currentTexture) {
         (currentTexture as THREE.Texture).dispose();
      }
      renderer.dispose();
    };

  }, [theme]); // Redraw scene when theme flips (re-renders default procedurals)

  // Local Storage persistence logic
  useEffect(() => {
    const saved = localStorage.getItem('sks_panorama_snapshots');
    if (saved) {
      try {
        setSnapshots(JSON.parse(saved));
      } catch (e) {
        console.error('[Snapshots] Restore error:', e);
      }
    }
  }, []);

  const saveSnapshotsToStorage = (list: CapturedViewpoint[]) => {
    localStorage.setItem('sks_panorama_snapshots', JSON.stringify(list));
  };

  // Convert Lens preset clicks
  const selectLensPreset = (mm: number, fovVal: number) => {
    setSelectedLens(mm);
    renderStateRef.current.fov = fovVal;
    setHudFov(fovVal);
  };

  // Convert Focal Length custom slider input
  const handleFocalLengthSlider = (fl: number) => {
    setSelectedLens(fl);
    // Convert fl (mm) to camera FOV
    const derivedFov = 2 * Math.atan(18 / fl) * (180 / Math.PI);
    const roundedFov = Math.max(10, Math.min(125, Math.round(derivedFov)));
    renderStateRef.current.fov = roundedFov;
    setHudFov(roundedFov);
  };

  // Apply lens barrel/pincushion distortion correction using backward coordinate mapping
  const applyDistortionWarp = (
    sourceImg: HTMLImageElement,
    strength: number,
    callback: (processedDataUrl: string) => void
  ) => {
    // If distortion correction is 0, skip the heavy canvas loop for speed
    if (strength === 0) {
      callback(sourceImg.src);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = sourceImg.width;
    canvas.height = sourceImg.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(sourceImg.src);
      return;
    }

    ctx.drawImage(sourceImg, 0, 0);
    const w = canvas.width;
    const h = canvas.height;
    const srcData = ctx.getImageData(0, 0, w, h);
    const dstData = ctx.createImageData(w, h);

    const srcPixels = srcData.data;
    const dstPixels = dstData.data;

    const centerX = w / 2;
    const centerY = h / 2;
    // Maximum diagonal radius to normalize distances
    const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

    // Backward mapping loop
    for (let y = 0; y < h; y++) {
      const dy = y - centerY;
      const yOffset = y * w;
      for (let x = 0; x < w; x++) {
        const dx = x - centerX;
        const r = Math.sqrt(dx * dx + dy * dy);
        const rNorm = r / maxRadius;

        // Radial distortion model (backward mapping):
        // Source radius factor based on polynomial model: r_src = r * (1 + strength * rNorm^3) or rNorm^2
        // strength > 0 pulls pixels inward (corrects barrel distortion by creating pincushion crop)
        // strength < 0 pushes pixels outward (corrects pincushion distortion by creating barrel crop)
        const factor = 1.0 + strength * rNorm * rNorm;
        
        // Find corresponding coordinate in source image
        const srcX = Math.round(centerX + dx * factor);
        const srcY = Math.round(centerY + dy * factor);

        const dstIdx = (yOffset + x) * 4;

        if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
          const srcIdx = (srcY * w + srcX) * 4;
          dstPixels[dstIdx] = srcPixels[srcIdx];
          dstPixels[dstIdx + 1] = srcPixels[srcIdx + 1];
          dstPixels[dstIdx + 2] = srcPixels[srcIdx + 2];
          dstPixels[dstIdx + 3] = srcPixels[srcIdx + 3];
        } else {
          // Clean solid dark boundaries for out-of-bounds mapping
          dstPixels[dstIdx] = 0;
          dstPixels[dstIdx + 1] = 0;
          dstPixels[dstIdx + 2] = 0;
          dstPixels[dstIdx + 3] = 255;
        }
      }
    }

    ctx.putImageData(dstData, 0, 0);
    callback(canvas.toDataURL('image/png'));
  };

  // Apply optical depth of field background bokeh blurring digitally using 2D Canvas
  const applyDepthOfFieldBlur = (
    sourceImg: HTMLImageElement,
    apertureVal: number,
    bType: 'none' | 'radial' | 'tilt-shift',
    callback: (processedDataUrl: string) => void
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = sourceImg.width;
    canvas.height = sourceImg.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return callback(sourceImg.src);

    if (bType === 'none' || apertureVal >= 8.0) {
      ctx.drawImage(sourceImg, 0, 0);
      callback(canvas.toDataURL('image/png'));
      return;
    }

    // Convert f-stop aperture f/1.2 - f/5.6 to blur radius in pixels
    const maxBlur = 12;
    const blurAmount = Math.max(1.5, (8 - apertureVal) * (maxBlur / 7));

    if (bType === 'radial') {
      // Draw blurred backdrop
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(sourceImg, 0, 0);

      // Create sharp center spotlight circle using mask
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(sourceImg, 0, 0);
        tempCtx.globalCompositeOperation = 'destination-in';

        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const rInner = Math.min(cx, cy) * 0.35;
        const rOuter = Math.min(cx, cy) * 0.95;

        const grad = tempCtx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
        grad.addColorStop(0, 'rgba(0,0,0,1)');      // Focus hotspot
        grad.addColorStop(0.4, 'rgba(0,0,0,0.85)');  // Smooth falloff transition 
        grad.addColorStop(1, 'rgba(0,0,0,0)');      // Highly blurred periphery

        tempCtx.fillStyle = grad;
        tempCtx.beginPath();
        tempCtx.arc(cx, cy, Math.max(cx, cy) * 1.5, 0, Math.PI * 2);
        tempCtx.fill();

        ctx.filter = 'none';
        ctx.drawImage(tempCanvas, 0, 0);
      }
    } else if (bType === 'tilt-shift') {
      // Draw blurred backdrop
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(sourceImg, 0, 0);

      // Overlay linear sharp stripe
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(sourceImg, 0, 0);
        tempCtx.globalCompositeOperation = 'destination-in';

        const grad = tempCtx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.32, 'rgba(0,0,0,0.15)');
        grad.addColorStop(0.45, 'rgba(0,0,0,1)');   // Focused zone
        grad.addColorStop(0.55, 'rgba(0,0,0,1)');   // Focused zone
        grad.addColorStop(0.68, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        tempCtx.fillStyle = grad;
        tempCtx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.filter = 'none';
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
    callback(canvas.toDataURL('image/png'));
  };

  // Draw Polaroid-style Polaroid EXIF card overlay
  const drawWatermarkCard = (
    imageDataUrl: string,
    titleText: string,
    customHeading: string,
    customLon: number,
    customLat: number,
    callback: (finalUrl: string) => void
  ) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageDataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const borderThickness = 12;
      const infoHeight = 65; // Height of metadata base strip
      
      canvas.width = img.width + borderThickness * 2;
      canvas.height = img.height + borderThickness * 3 + infoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return callback(imageDataUrl);
      
      const isLightMode = theme === 'light';
      ctx.fillStyle = isLightMode ? '#ffffff' : '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Postcard thin enclosing boundary stroke
      ctx.strokeStyle = isLightMode ? '#e2e8f0' : 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Draw photography image
      ctx.drawImage(img, borderThickness, borderThickness);
      
      // Small divider accent
      ctx.fillStyle = isLightMode ? '#f1f5f9' : '#18181b';
      ctx.fillRect(borderThickness, borderThickness + img.height, img.width, 1);
      
      // Metadata fields
      ctx.textBaseline = 'middle';
      
      // Left logo & angles
      ctx.fillStyle = isLightMode ? '#334155' : '#e4e4e7';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(titleText || '3D PANORAMA VIEWPOINT', borderThickness + 10, borderThickness + img.height + 22);
      
      ctx.fillStyle = isLightMode ? '#64748b' : '#71717a';
      ctx.font = '9px monospace';
      ctx.fillText(`COORDS: AZIMUTH ${customLon}° / PITCH ${customLat}°  [HEADING: ${customHeading}]`, borderThickness + 10, borderThickness + img.height + 36);
      
      // Center Focus grid logo
      const midX = canvas.width / 2;
      const midY = borderThickness + img.height + 32;
      ctx.strokeStyle = isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(midX, midY, 6, 0, Math.PI * 2);
      ctx.moveTo(midX - 12, midY); ctx.lineTo(midX + 12, midY);
      ctx.moveTo(midX, midY - 12); ctx.lineTo(midX, midY + 12);
      ctx.stroke();
      
      // Right optics camera specs
      ctx.textAlign = 'right';
      ctx.fillStyle = isLightMode ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText(`${selectedLens}mm PRIME  |  f/${selectedAperture.toFixed(1)}`, canvas.width - borderThickness - 10, borderThickness + img.height + 22);
      
      ctx.fillStyle = isLightMode ? '#64748b' : '#71717a';
      ctx.font = '9px monospace';
      const dofLabel = blurType === 'none' ? 'DEEP_FOCUS' : blurType === 'radial' ? 'PORTRAIT_BOKEH' : 'TILT_SHIFT';
      ctx.fillText(`ISO 100 | 1/250s | ${dofLabel} | FOV ${hudFov}°`, canvas.width - borderThickness - 10, borderThickness + img.height + 36);
      
      callback(canvas.toDataURL('image/png'));
    };
  };

  // Click handler to snapshot a single customized viewpoint
  const handleSingleCapture = () => {
    if (!canvasRef.current || isCapturing) return;
    setIsCapturing(true);
    
    // Trigger immediate render tick
    if (engineRef.current) {
      engineRef.current.renderer?.render(engineRef.current.scene!, engineRef.current.camera!);
    }
    
    const rawDataUrl = canvasRef.current.toDataURL('image/png');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = rawDataUrl;
    img.onload = () => {
      // First stage: Apply mechanical lens distortion correction
      applyDistortionWarp(img, distortion, (warpedUrl) => {
        const warpedImg = new Image();
        warpedImg.crossOrigin = 'anonymous';
        warpedImg.src = warpedUrl;
        warpedImg.onload = () => {
          // Second stage: Apply bokeh depth-of-field
          applyDepthOfFieldBlur(warpedImg, selectedAperture, blurType, (processedDataUrl) => {
            const currentLon = renderStateRef.current.lon;
            const currentLat = renderStateRef.current.lat;
            const roundedLon = Math.round(currentLon % 360);
            const positiveLon = roundedLon < 0 ? roundedLon + 360 : roundedLon;
            const roundedLat = Math.round(currentLat);
            
            const titleVal = snapshotTitle.trim() || `机位快照 #${snapshots.length + 1}`;
            
            const applyWatermarkAndSave = (cb: (finalUrl: string) => void) => {
              if (enableWatermark) {
                drawWatermarkCard(
                  processedDataUrl, 
                  titleVal, 
                  hudOrientation.heading, 
                  positiveLon, 
                  roundedLat, 
                  cb
                );
              } else {
                cb(processedDataUrl);
              }
            };
            
            applyWatermarkAndSave((finalCardDataUrl) => {
              const lensName = LENS_PRESETS.find(p => p.mm === selectedLens)?.name.split(' ').slice(1).join(' ') || `${selectedLens}mm 镜头`;
              const newSnapshot: CapturedViewpoint = {
                id: 'snapshot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                image: finalCardDataUrl,
                rawImage: processedDataUrl,
                lon: positiveLon,
                lat: roundedLat,
                heading: hudOrientation.heading,
                fov: hudFov,
                lensType: lensName,
                focalLength: selectedLens,
                aperture: selectedAperture,
                blurType: blurType,
                distortion: distortion,
                timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
                title: titleVal
              };
              
              setSnapshots(prev => {
                const updated = [newSnapshot, ...prev];
                saveSnapshotsToStorage(updated);
                return updated;
              });
              setSnapshotTitle('');
              setIsCapturing(false);
            });
          });
        };
      });
    };
  };

  // Click handler to scan and capture multiple perspectives automatically (North, East, South, West sweep)
  const handleMultiSweepCapture = () => {
    if (!canvasRef.current || !engineRef.current || isCapturing) return;
    setIsCapturing(true);
    
    const { renderer, scene, camera } = engineRef.current;
    if (!renderer || !scene || !camera) {
      setIsCapturing(false);
      return;
    }
    
    // Stash original look coordinates
    const origLon = renderStateRef.current.lon;
    const origLat = renderStateRef.current.lat;
    
    const sweepAngles = [
      { deg: 180, name: '正北方向 (North 0°)' }, // 180 is looking forward
      { deg: 270, name: '正东方向 (East 90°)' },
      { deg: 0,   name: '正南方向 (South 180°)' },
      { deg: 90,  name: '正西方向 (West 270°)' }
    ];
    
    const newCapturedList: CapturedViewpoint[] = [];
    let completedCount = 0;
    
    sweepAngles.forEach((angle, index) => {
      setTimeout(() => {
        // Rotate camera immediately
        renderStateRef.current.lon = angle.deg;
        renderStateRef.current.targetLon = angle.deg;
        renderStateRef.current.lat = 0;
        renderStateRef.current.targetLat = 0;
        
        const phi = THREE.MathUtils.degToRad(90); // Eye-level view
        const theta = THREE.MathUtils.degToRad(angle.deg);
        
        const lookX = 500 * Math.sin(phi) * Math.sin(theta);
        const lookY = 500 * Math.cos(phi);
        const lookZ = 500 * Math.sin(phi) * Math.cos(theta);
        
        camera.lookAt(new THREE.Vector3(lookX, lookY, lookZ));
        renderer.render(scene, camera);
        
        const rawDataUrl = canvasRef.current!.toDataURL('image/png');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = rawDataUrl;
        img.onload = () => {
          // Warp sweeps as well
          applyDistortionWarp(img, distortion, (warpedUrl) => {
            const warpedImg = new Image();
            warpedImg.crossOrigin = 'anonymous';
            warpedImg.src = warpedUrl;
            warpedImg.onload = () => {
              applyDepthOfFieldBlur(warpedImg, selectedAperture, blurType, (processedDataUrl) => {
                const tempLon = angle.deg;
                const posLon = (tempLon % 360 + 360) % 360;
                
                // Generate headings character
                let headingSymbol = 'N';
                if (posLon === 180) headingSymbol = 'N';
                else if (posLon === 270) headingSymbol = 'E';
                else if (posLon === 0 || posLon === 360) headingSymbol = 'S';
                else if (posLon === 90) headingSymbol = 'W';
                
                const applyWatermarkAndSaveSweep = (cb: (finalUrl: string) => void) => {
                  if (enableWatermark) {
                    drawWatermarkCard(
                      processedDataUrl, 
                      `环扫视角 · ${angle.name.split(' ')[0]}`, 
                      headingSymbol, 
                      posLon, 
                      0, 
                      cb
                    );
                  } else {
                    cb(processedDataUrl);
                  }
                };
                
                applyWatermarkAndSaveSweep((finalCardUrl) => {
                  const lensName = LENS_PRESETS.find(p => p.mm === selectedLens)?.name.split(' ').slice(1).join(' ') || `${selectedLens}mm 镜头`;
                  newCapturedList.push({
                    id: 'snapshot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    image: finalCardUrl,
                    rawImage: processedDataUrl,
                    lon: posLon,
                    lat: 0,
                    heading: headingSymbol,
                    fov: hudFov,
                    lensType: lensName,
                    focalLength: selectedLens,
                    aperture: selectedAperture,
                    blurType: blurType,
                    distortion: distortion,
                    timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
                    title: `全景扫描 - ${angle.name.substring(0, 4)}`
                  });
                  
                  completedCount++;
                    
                    // Done on all 4 directions!
                    if (completedCount === sweepAngles.length) {
                      setSnapshots(prev => {
                        const combined = [...newCapturedList, ...prev];
                        saveSnapshotsToStorage(combined);
                        return combined;
                      });
                      
                      // Restore look angle gracefully
                      renderStateRef.current.lon = origLon;
                      renderStateRef.current.targetLon = origLon;
                      renderStateRef.current.lat = origLat;
                      renderStateRef.current.targetLat = origLat;
                      
                      setIsCapturing(false);
                    }
                  }
                );
              });
            };
          });
        };
      }, index * 120); // Smooth sequence sweeps
    });
  };

  const handleDeleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    saveSnapshotsToStorage(updated);
  };

  const handleDownloadSnapshot = (snap: CapturedViewpoint, e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.download = `${snap.title.trim().replace(/\s+/g, '_')}_focal${snap.focalLength}mm_f${snap.aperture}.png`;
    link.href = snap.image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset Camera back to central azimuth orientation
  const handleResetCamera = () => {
    const state = renderStateRef.current;
    
    // Normalize current longitude to [0, 360) to prevent violent backward spin wrapping
    const currentLonNormalized = ((state.lon % 360) + 360) % 360;
    state.lon = currentLonNormalized;
    
    state.targetLon = 180;
    state.targetLat = 0;
    state.fov = 75;
    setHudFov(75);
    setSelectedLens(fovToFocalLength(75));
  };

  // Full screen trigger custom container
  const toggleFullscreenMode = () => {
    if (!containerRef.current) return;
    
    // Toggle container style size or request agent frame standard FS
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Keep track of DOM listener for native fullscreen exit
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 text-left" id="panorama-module-container">
      {/* 1. Header Toolbar Control Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" id="panorama-toolbar">
        {/* iOS style Segmented Selector Control */}
        <div className="flex flex-wrap items-center gap-1.5" id="panorama-source-selectors">
          <span className={`text-[11px] font-medium block mr-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
            全景背景源:
          </span>
          <div className={`flex p-0.5 rounded-lg border transition-all ${
            theme === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-800/80 border-white/5'
          }`}>
            <button
              onClick={() => setActiveSource('preset_cyber')}
              className={`px-3 py-1 text-[10.5px] rounded-md font-medium cursor-pointer transition-all ${
                activeSource === 'preset_cyber'
                  ? theme === 'light' ? 'bg-white text-zinc-900 shadow-xs ring-1 ring-black/5 font-semibold' : 'bg-zinc-700 text-white font-semibold'
                  : theme === 'light' ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}
            >
              💻 赛博矩阵
            </button>
            <button
              onClick={() => setActiveSource('preset_nebula')}
              className={`px-3 py-1 text-[10.5px] rounded-md font-medium cursor-pointer transition-all ${
                activeSource === 'preset_nebula'
                  ? theme === 'light' ? 'bg-white text-zinc-900 shadow-xs ring-1 ring-black/5 font-semibold' : 'bg-zinc-700 text-white font-semibold'
                  : theme === 'light' ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}
            >
              🌌 深空星云
            </button>
            <button
              onClick={() => setActiveSource('preset_studio')}
              className={`px-3 py-1 text-[10.5px] rounded-md font-medium cursor-pointer transition-all ${
                activeSource === 'preset_studio'
                  ? theme === 'light' ? 'bg-white text-zinc-900 shadow-xs ring-1 ring-black/5 font-semibold' : 'bg-zinc-700 text-white font-semibold'
                  : theme === 'light' ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}
            >
              📸 摄影棚
            </button>
          </div>

          {/* Reference Image Actions */}
          <div className="flex gap-1">
            <button
              onClick={() => {
                if (uploadedSrc) {
                  setActiveSource('uploaded');
                }
              }}
              disabled={!uploadedSrc}
              className={`px-3 py-1 text-[10.5px] font-medium rounded-lg border transition-all ${
                !uploadedSrc
                  ? 'opacity-40 cursor-not-allowed border-dashed border-zinc-200 text-zinc-400 dark:border-white/5'
                  : activeSource === 'uploaded'
                    ? 'bg-[#007aff]/10 text-[#007aff] border-[#007aff]/30 font-semibold cursor-pointer'
                    : 'bg-transparent border-zinc-200 hover:bg-zinc-100 text-zinc-500 dark:border-white/10 dark:hover:bg-white/5 dark:text-zinc-400 cursor-pointer'
              }`}
              title={!uploadedSrc ? '未上传任何前背景参考图' : '在全景中铺设您上传的源参考图'}
            >
              🖼️ 导入参考图
            </button>
            <button
              onClick={() => {
                if (renderedSrc) {
                  setActiveSource('rendered');
                }
              }}
              disabled={!renderedSrc}
              className={`px-3 py-1 text-[10.5px] font-medium rounded-lg border transition-all ${
                !renderedSrc
                  ? 'opacity-40 cursor-not-allowed border-dashed border-zinc-200 text-zinc-400 dark:border-white/5'
                  : activeSource === 'rendered'
                    ? 'bg-[#ea580c]/10 text-[#ea580c] border-[#ea580c]/30 font-semibold cursor-pointer'
                    : 'bg-transparent border-zinc-200 hover:bg-zinc-100 text-zinc-500 dark:border-white/10 dark:hover:bg-white/5 dark:text-zinc-400 cursor-pointer'
              }`}
              title={!renderedSrc ? '未完成任何新机位视角渲染' : '将刚刚生成的视角照片包围作为背景'}
            >
              ✨ 导入渲染图
            </button>
          </div>
        </div>

        {/* Right tools (reset, etc) */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleResetCamera}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
            title="恢复初始视线"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {imgError && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-mono text-left">
          ⚠️ {imgError}
        </div>
      )}

      {/* 2. Primary 3D Viewer Box */}
      <div 
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-2xl bg-neutral-950 border border-slate-800/80 group transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 z-50 h-screen rounded-none' : 'h-[380px] md:h-[450px]'
        }`}
        id="panorama-canvas-outer"
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block cursor-grab active:cursor-grabbing transition-transform duration-150" 
          id="panorama-three-canvas" 
          style={{
            transform: `scale(${1 + Math.abs(distortion) * 0.1})`,
          }}
        />

        {/* Dynamic camera calibrated guide lines under lens distortion */}
        {showCalibGrid && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none select-none z-10" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
          >
            {(() => {
              const bend = -distortion * 15; // range from -4.5% to +4.5% of container size
              const paths = {
                tH: `M 0,25 Q 50,${25 + bend} 100,25`,
                mH: `M 0,50 Q 50,${50 + bend} 100,50`,
                bH: `M 0,75 Q 50,${75 + bend} 100,75`,
                lV: `M 25,0 Q ${25 + bend},50 25,100`,
                mV: `M 50,0 Q ${50 + bend},50 50,100`,
                rV: `M 75,0 Q ${75 + bend},50 75,100`
              };
              return (
                <>
                  {/* Horizontal Guide lines */}
                  <path d={paths.tH} fill="none" stroke="rgba(34, 211, 238, 0.18)" strokeWidth="0.35" strokeDasharray="1 1" />
                  <path d={paths.mH} fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="0.45" strokeDasharray="1.5 1.5" />
                  <path d={paths.bH} fill="none" stroke="rgba(34, 211, 238, 0.18)" strokeWidth="0.35" strokeDasharray="1 1" />
                  
                  {/* Vertical Guide lines */}
                  <path d={paths.lV} fill="none" stroke="rgba(34, 211, 238, 0.18)" strokeWidth="0.35" strokeDasharray="1 1" />
                  <path d={paths.mV} fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="0.45" strokeDasharray="1.5 1.5" />
                  <path d={paths.rV} fill="none" stroke="rgba(34, 211, 238, 0.18)" strokeWidth="0.35" strokeDasharray="1 1" />
                  
                  {/* Target concentric reticle inside center */}
                  <circle cx="50" cy="50" r="1.5" fill="none" stroke="rgba(244, 63, 94, 0.45)" strokeWidth="0.3" />
                  <circle cx="50" cy="50" r="5" fill="none" stroke="rgba(244, 63, 94, 0.25)" strokeWidth="0.2" strokeDasharray="0.5 0.5" />
                </>
              );
            })()}
          </svg>
        )}

        {/* HUD Compass Ring overlay at Center Top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none select-none font-mono text-xs flex items-center gap-1.5 bg-black/85 border border-white/10 px-3.5 py-1.5 rounded-full text-white backdrop-blur-md shadow-lg">
          <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          <span className="font-bold tracking-widest text-cyan-400">{hudOrientation.heading}</span>
          <span className="text-[10px] text-gray-400">|</span>
          <span className="text-[10px] text-gray-300">
            水平 <strong>{hudOrientation.lon}°</strong>
          </span>
          <span className="text-[10px] text-gray-400">|</span>
          <span className="text-[10px] text-gray-300">
            俯仰 <strong>{hudOrientation.lat}°</strong>
          </span>
          <span className="text-[10px] text-gray-400">|</span>
          <span className="text-[10px] text-gray-300">
            FOV <strong>{hudFov}°</strong>
          </span>
        </div>

        {/* Direct interactive tips instructions (Fade-out-on-hover) */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none text-[10px] font-mono select-none opacity-85 transition-opacity group-hover:opacity-40">
          <div className="flex items-center gap-1.5 text-gray-200 bg-neutral-900/80 px-2 py-1 rounded border border-white/5 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
            <span>按住鼠标左键 / 单指拖地：旋转 360° 环视视角</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-200 bg-neutral-900/80 px-2 py-1 rounded border border-white/5 backdrop-blur-xs">
            <span className="w-1.5 h-1.5 bg-pink-500 rounded-full"></span>
            <span>鼠标滚轮 / 双指捏合：拉近/推远超广角焦距</span>
          </div>
        </div>

        {/* Top Right Tool Controllers */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {/* Automatic spinning rate speed */}
          <div className="flex items-center gap-1 bg-black/80 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="text-[10px] font-mono text-gray-200 hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
            >
              {autoRotate ? (
                <>
                  <Pause className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span className="text-[9px] text-cyan-400 font-bold">自动旋转：启用</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span className="text-[9px] text-gray-400">自动旋转：禁用</span>
                </>
              )}
            </button>
            {autoRotate && (
              <select
                value={autoRotateSpeed}
                onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                className="bg-transparent border-none text-[9px] font-mono font-bold text-cyan-400 focus:outline-none ml-1 accent-cyan-500 cursor-pointer"
                title="旋转速度"
              >
                <option value="0.5" className="bg-neutral-900 text-white">0.5x</option>
                <option value="1.0" className="bg-neutral-900 text-white">1.0x</option>
                <option value="2.0" className="bg-neutral-900 text-white">2.0x</option>
                <option value="3.0" className="bg-neutral-900 text-white">3.0x</option>
              </select>
            )}
          </div>

          {/* Full Screen toggle */}
          <button
            onClick={toggleFullscreenMode}
            className="p-1.5 rounded-lg bg-black/85 border border-white/10 text-gray-200 hover:text-white cursor-pointer backdrop-blur-md"
            title={isFullscreen ? '退出全屏' : '全屏体验'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Bottom Left dynamic HUD telemetry */}
        <div className="absolute bottom-4 left-4 pointer-events-none select-none font-mono text-[9px] text-gray-500 bg-black/80 border border-white/5 py-1 px-2 rounded backdrop-blur-xs flex flex-col gap-0.5 text-left">
          <span>SPATIAL VECTOR: STATUS_READY</span>
          <span>COMPASS GRID: EQUIRECTANGULAR_PROJECTION</span>
          <span>SYSTEM DEPTH: 500 UNITS (INWARD_SHIELD)</span>
        </div>
      </div>

      {/* 3D Panorama Snapshot Studio (3D全景多机位快照工坊) */}
      <div className={`p-6 rounded-3xl flex flex-col gap-6 transition-all duration-500 border border-white/10 ${
        theme === 'light'
          ? 'liquid-glass-light text-zinc-900 shadow-xl shadow-slate-100'
          : 'liquid-glass-dark text-zinc-100 shadow-2xl shadow-black/40'
      }`} id="panorama-snapshot-studio">
        
        {/* Title row with Dynamic Island & Live Shutter Simulation style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-tr from-[#007aff] to-[#00c7fc] text-white shadow-md shadow-[#007aff]/20 animate-pulse-slow">
              <Camera className="w-5 h-5" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight font-sans">全景快照与镜头工坊</h3>
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-cyan-405 rounded-full" />
                3D视角微型物理摄影模拟器 (Retina Optics Stack)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950/10 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 text-[10px] font-mono text-zinc-650 dark:text-zinc-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-405 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>BI-OPTIC SENSOR ON</span>
            </div>
          </div>
        </div>

        {/* Two Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Optics Camera Calibration (光学镜头设定) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 font-semibold text-xs tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
              <Sliders className="w-4 h-4 text-[#007aff]" />
              <span>智能双摄传感器调校 (Lens Setup)</span>
            </div>

            {/* A. Lens Presets Segmented Capsule */}
            <div className="flex flex-col gap-2">
              <label className={`text-[11px] font-medium flex items-center justify-between ${theme === 'light' ? 'text-zinc-650' : 'text-zinc-400'}`}>
                <span className="flex items-center gap-1">
                  <Film className="w-3 h-3 text-cyan-500" />
                  镜头物理规格 (Apertures & Lenses):
                </span>
                <span className="text-[#007aff] text-[10.5px] font-bold tracking-wider font-mono bg-[#007aff]/10 dark:bg-[#007aff]/20 px-2 py-0.5 rounded-full">
                  {selectedLens}mm PRIME
                </span>
              </label>
              
              {/* iOS-Style Sliding Segment Box */}
              <div className="p-1 rounded-2xl bg-zinc-200/55 dark:bg-white/5 border border-zinc-200/30 dark:border-white/5 grid grid-cols-4 gap-1">
                {LENS_PRESETS.map((p) => {
                  const isActive = selectedLens === p.mm;
                  return (
                    <button
                      key={p.mm}
                      type="button"
                      onClick={() => selectLensPreset(p.mm, p.fov)}
                      className={`py-1.5 px-0.5 text-[9.5px] font-semibold rounded-xl cursor-pointer text-center transition-all duration-300 ${
                        isActive
                          ? 'bg-white dark:bg-zinc-900 text-[#007aff] dark:text-cyan-405 border-[0.5px] border-zinc-200 dark:border-white/10 shadow-md font-bold'
                          : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                      title={p.name}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              
              {/* Highlight Tagline of active Lens */}
              <div className="text-[10px] pl-1 text-zinc-500 dark:text-zinc-400 bg-zinc-100/50 dark:bg-white/5 p-2 rounded-xl border border-zinc-150 dark:border-white/5 text-left font-sans italic flex items-center gap-1.5 leading-tight">
                <span className="text-[#007aff] font-bold">ℹ️</span>
                {LENS_PRESETS.find(p => p.mm === selectedLens)?.name || `${selectedLens}mm 镜头`}
              </div>
            </div>

            {/* B. Focal Length Fine Tune Section */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/30 dark:border-white/5">
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-semibold ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>微距/远摄焦距平滑调节 (Focal Length):</span>
                <span className="text-[10.5px] font-mono font-bold text-[#007aff]">
                  {selectedLens} <span className="text-xs">mm</span> <span className="text-zinc-400 font-normal">/ FOV {hudFov}°</span>
                </span>
              </div>
              
              {/* Mechanical Ring Indicator Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 w-8 text-right">8mm</span>
                <div className="flex-1 flex flex-col gap-1.5">
                  <input
                    type="range"
                    min="8"
                    max="200"
                    step="1"
                    value={selectedLens}
                    onChange={(e) => handleFocalLengthSlider(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-300 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#007aff] transition-all hover:accent-[#005ec8]"
                    id="snapshot-focal-slider"
                  />
                  {/* Tactile tick markings */}
                  <div className="flex justify-between px-1 text-[7px] font-mono text-zinc-300 dark:text-zinc-600 select-none">
                    <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 w-10 text-left">200mm</span>
              </div>
            </div>

            {/* C. Aperture settings + Shutter Iris Simulation */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/30 dark:border-white/5">
              
              {/* Miniature Shutter Simulation Graphic */}
              <div className="sm:col-span-3 flex flex-col items-center justify-center gap-1.5">
                <div className="relative w-12 h-12 rounded-full border border-zinc-300 dark:border-white/10 flex items-center justify-center bg-zinc-200 dark:bg-neutral-900 overflow-hidden shadow-inner">
                  {/* Iris blades rotation effect based on size */}
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-dashed border-[#ef4444]/40 flex items-center justify-center transition-all duration-500"
                    style={{ 
                      transform: `rotate(${selectedAperture * 20}deg)`,
                      scale: `${0.45 + (1 / selectedAperture) * 0.45}` 
                    }}
                  >
                    <div className="w-5 h-5 bg-[#ef4444] rounded-full opacity-30 filter blur-[1.5px]" />
                  </div>
                  <div className="absolute text-[8px] font-black font-mono text-[#ef4444]">
                    F{selectedAperture.toFixed(1)}
                  </div>
                </div>
                <span className="text-[8.5px] font-mono text-zinc-400 dark:text-zinc-500 tracking-wider">LENS BLADE</span>
              </div>

              {/* Aperture Controls */}
              <div className="sm:col-span-9 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>数字光圈值 (Aperture Scale):</span>
                  <span className="text-[10.5px] font-bold text-[#ef4444] bg-[#ef4444]/10 dark:bg-[#ef4444]/20 px-2 py-0.5 rounded-full">
                    f/{selectedAperture.toFixed(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-1">
                  {[1.2, 1.8, 2.8, 4.0, 5.6, 8.0, 11, 16].map((fVal) => {
                    const isActive = selectedAperture === fVal;
                    return (
                      <button
                        key={fVal}
                        type="button"
                        onClick={() => setSelectedAperture(fVal)}
                        className={`py-1 px-1 text-[9px] font-mono rounded-lg cursor-pointer border text-center transition-all duration-300 ${
                          isActive
                            ? 'bg-[#ef4444] text-white border-[#ef4444]/30 font-bold shadow-lg shadow-[#ef4444]/20'
                            : 'bg-white dark:bg-black/20 border-zinc-200/50 dark:border-white/5 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                        }`}
                      >
                        f/{fVal.toFixed(1)}
                      </button>
                    );
                  })}
                </div>
                
                {/* Micro focus algorithm control */}
                <div className="flex flex-col gap-1.5 mt-1 border-t border-zinc-200/30 dark:border-white/5 pt-2">
                  <span className={`text-[10px] font-semibold text-left ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>景深虚化渲染引擎 (Defocus Algorithm):</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setBlurType('none')}
                      className={`flex-1 py-1.5 px-2 text-[10px] font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        blurType === 'none'
                          ? 'bg-[#af52de] text-white border-[#af52de]/35 shadow-md shadow-[#af52de]/15'
                          : 'bg-white dark:bg-black/20 border-zinc-200/50 dark:border-white/5 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      全景深 (Infinite Focus)
                    </button>
                    <button
                      onClick={() => setBlurType('radial')}
                      className={`flex-1 py-1.5 px-2 text-[10px] font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        blurType === 'radial'
                          ? 'bg-[#af52de] text-white border-[#af52de]/35 shadow-md shadow-[#af52de]/15'
                          : 'bg-white dark:bg-black/20 border-zinc-200/50 dark:border-white/5 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      浅景深 (Cinematic Bokeh)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* E. Lens Distortion Correction & Grid calibration */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-zinc-100/50 dark:bg-white/5 border border-zinc-200/30 dark:border-white/5">
              <div className="flex items-center justify-between text-[11px]">
                <span className={`font-semibold ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>物理光学畸变校正 (Lens Distortion):</span>
                <span className="text-[10.5px] font-bold text-[#007aff] bg-[#007aff]/10 dark:bg-[#007aff]/20 px-2 py-0.5 rounded-full font-mono">
                  {distortion === 0 ? '绝对平面 (Flat_0.0)' : distortion > 0 ? `枕形修复 (+${distortion.toFixed(2)})` : `桶形修正 (${distortion.toFixed(2)})`}
                </span>
              </div>

              {/* Grid calibration switch with iOS Cupertino toggle styles */}
              <div className="flex items-center justify-between text-[10px] border-b border-zinc-200/30 dark:border-white/5 pb-2">
                <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Focus className="w-3 h-3 text-emerald-500" />
                  实时投射 3D 物理弯曲校正比例刻度网格:
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showCalibGrid}
                    onChange={(e) => setShowCalibGrid(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-neutral-800 rounded-full peer peer-checked:bg-[#34c759] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:shadow-sm after:transition-all"></div>
                </label>
              </div>
              
              {/* Distortion Slider */}
              <div className="flex items-center gap-2 mb-1 pt-1">
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">-0.30 桶</span>
                <input
                  type="range"
                  min="-0.3"
                  max="0.3"
                  step="0.01"
                  value={distortion}
                  onChange={(e) => setDistortion(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-300 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#007aff] transition-all"
                  id="snapshot-distortion-slider"
                />
                <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">+0.30 枕</span>
              </div>
              
              {/* Preset buttons designed as segments */}
              <div className="grid grid-cols-4 gap-1 mt-1">
                {[
                  { val: 0.0, label: '零畸变', title: '无镜片物理弯曲校正' },
                  { val: 0.08, label: '微修正', title: '微弱修正超广角边缘桶向弯曲' },
                  { val: 0.18, label: '广角修正', title: '精准重整14mm极窄焦距畸变' },
                  { val: -0.15, label: '鱼眼特效', title: '高弧度内缩呈现复古广角大球面' }
                ].map((item) => {
                  const isActive = distortion === item.val;
                  return (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setDistortion(item.val)}
                      className={`py-1.5 px-0.5 text-[9.5px] font-medium rounded-xl cursor-pointer border text-center transition-all duration-300 ${
                        isActive
                          ? 'bg-[#007aff] text-white border-[#007aff]/30 font-bold shadow-md shadow-[#007aff]/15'
                          : 'bg-white dark:bg-black/15 border-zinc-200/50 dark:border-white/5 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                      }`}
                      title={item.title}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* D. Elegant optical description card */}
            <div className="p-3.5 rounded-2xl border border-zinc-200/55 dark:border-white/5 bg-zinc-100/30 dark:bg-black/10 text-[10.5px] leading-relaxed text-zinc-500 dark:text-zinc-400 text-left font-sans flex flex-col gap-1">
              <span className="font-bold flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                <span>🔬</span> 全网超前物理散景测算 (Optic Bokeh Coprocessor)
              </span>
              {selectedAperture <= 2.8 && blurType !== 'none' ? (
                <span className="text-purple-600 dark:text-purple-400">
                  ⚡️ <strong>光斑融合模式激活：</strong> 当前搭载 <strong>f/{selectedAperture}</strong> 数字浅景深模拟，景物将按景深梯度向后级柔顺过渡。
                </span>
              ) : (
                <span>
                  • 极深景深对焦在恒定 <strong>f/{selectedAperture}</strong>。中央与边缘皆通过平行衍射矩阵输出高分辨率绝对清晰影像。
                </span>
              )}
            </div>

          </div>

          {/* Right Column: Snap Workbench and Saved Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-5 border-t lg:border-t-0 lg:border-l border-zinc-200/50 dark:border-white/10 pt-5 lg:pt-0 lg:pl-6">
            <div className="flex items-center gap-2 font-semibold text-xs tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
              <Camera className="w-4 h-4 text-[#af52de]" />
              <span>全景空间猎取快照工坊 (Shooting Studio)</span>
            </div>

            {/* Custom Photo Title Info Group */}
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[11px] font-semibold text-zinc-650 dark:text-zinc-400 flex items-center gap-1">
                  <span>🏷️</span>
                  空间拍摄快照备注名称 (EXIF Label / Meta Name):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={snapshotTitle}
                    onChange={(e) => setSnapshotTitle(e.target.value)}
                    placeholder={`例: 客厅落地窗 / 主卧全景测绘 (默认: 机位快照 #${snapshots.length + 1})`}
                    className="w-full text-xs pl-3.5 pr-10 py-2.5 hover:border-zinc-300 dark:hover:border-white/20 dark:bg-zinc-950/45 text-zinc-850 dark:text-white rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#007aff] font-sans transition-all"
                    id="snapshot-title-input"
                    maxLength={25}
                  />
                  {snapshotTitle && (
                    <button 
                      onClick={() => setSnapshotTitle('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-zinc-200 hover:bg-zinc-300 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-500 hover:text-zinc-800 dark:hover:text-white text-[9px] cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Watermark Card Frame Toggle Switch */}
              <div className="flex items-center justify-between text-[11px] bg-zinc-100/50 dark:bg-white/5 p-3.5 rounded-2xl border border-zinc-200/55 dark:border-white/5">
                <div className="flex flex-col text-left gap-0.5 max-w-[80%]">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">复古胶片级 EXIF 水印边框卡 (EXIF Frame Card)</span>
                  <span className="text-[10px] text-zinc-505 dark:text-zinc-400 leading-tight">启用后输出带有光圈/焦距等物理测算元数据印记的高清照片框架</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableWatermark}
                    onChange={(e) => setEnableWatermark(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-zinc-300 dark:bg-neutral-800 rounded-full peer peer-checked:bg-[#34c759] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:shadow-sm after:transition-all"></div>
                </label>
              </div>

              {/* Interactive capture actions redesigned into high-fidelity iOS pill docks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Singular Click - Camera/Optics icon, premium hover shadow */}
                <button
                  type="button"
                  onClick={handleSingleCapture}
                  disabled={isCapturing}
                  className="relative group overflow-hidden px-4 py-3 bg-gradient-to-r from-[#007aff] to-[#005bc4] disabled:from-zinc-500 disabled:to-zinc-650 text-white font-bold rounded-2xl cursor-pointer text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/25 active:scale-[0.98]"
                  id="snapshot-single-action"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isCapturing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                      <span>传感器测光对焦中...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>捕捉当前单视角 (Capture Spot)</span>
                    </>
                  )}
                </button>

                {/* Multi-sweep captures with 360 multi angles, magenta gradients and soft glows */}
                <button
                  type="button"
                  onClick={handleMultiSweepCapture}
                  disabled={isCapturing}
                  className="relative group overflow-hidden px-4 py-3 bg-gradient-to-r from-[#af52de] to-[#9233c4] disabled:from-zinc-500 disabled:to-zinc-650 text-white font-bold rounded-2xl cursor-pointer text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 active:scale-[0.98]"
                  id="snapshot-sweep-action"
                  title="自动旋转照相机，捕获东西南北4个朝向照片，成组储存到下方图廊"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {isCapturing ? (
                    <>
                      <Layers className="w-4 h-4 animate-bounce text-pink-200" />
                      <span>四轴伺服马达定位中...</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4 transition-transform group-hover:rotate-45" />
                      <span>360° 四向自动级环扫</span>
                    </>
                  )}
                </button>

              </div>
            </div>

            {/* Gallery Header Area with dynamic count badges */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-200/30 dark:border-white/5">
                <span className="font-semibold text-zinc-650 dark:text-zinc-400 flex items-center gap-1">
                  <span>📸</span>
                  快照存档图廊 (Retina Photo Library):
                </span>
                <span className="font-mono text-[10px] text-zinc-650 dark:text-zinc-300 bg-zinc-200 dark:bg-white/10 px-2 py-0.5 rounded-full font-bold">
                  共 {snapshots.length} 组快照存档
                </span>
              </div>

              {snapshots.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                  <CameraOff className="w-7 h-7 text-slate-300 dark:text-gray-600 mb-2" />
                  <span className="text-[11px] text-gray-400">
                    尚无截取的图档存档
                  </span>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-[270px]">
                    在上方 3D 全景中拖拽寻找美丽的机位角度，然后点击按钮。我们将模拟单反相机曝光输出，定制一份您自署名的专业 EXIF 摄影卡片！
                  </p>
                </div>
              ) : (
                <div className="relative w-full overflow-hidden" id="snapshot-gallery-scroller-box">
                  {/* Horizontal Scroll bar wrapping */}
                  <div className="flex items-start gap-3.5 overflow-x-auto pb-2 scrollbar-thin dark:scrollbar-track-neutral-900 scrollbar-thumb-neutral-700/50 pr-2 snap-x">
                    {snapshots.map((snap) => (
                      <div
                        key={snap.id}
                        onClick={() => setSelectedPreviewSnapshot(snap)}
                        className="flex-shrink-0 w-[140px] snap-start rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:border-cyan-500/50 cursor-pointer group/card transition-all flex flex-col gap-1.5 pb-2"
                      >
                        {/* Polaroid shot preview */}
                        <div className="relative aspect-[4/3] bg-neutral-950 overflow-hidden">
                          <img
                            src={snap.rawImage}
                            alt={snap.title}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {/* Compass Tag overlay */}
                          <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-cyan-400 border border-white/10 select-none">
                            {snap.heading} {snap.lon}°
                          </div>
                        </div>

                        {/* Text descriptions */}
                        <div className="px-2 flex flex-col text-left">
                          <span className="text-[11px] font-bold truncate text-slate-700 dark:text-gray-200 leading-tight">
                            {snap.title}
                          </span>
                          <span className="text-[9px] text-gray-400 font-mono mt-0.5">
                            {snap.focalLength}mm f/{snap.aperture.toFixed(1)}
                          </span>
                        </div>

                        {/* Interactive triggers overlay */}
                        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/5 pt-1.5 px-2.5 mt-0.5">
                          {/* Download */}
                          <button
                            type="button"
                            onClick={(e) => handleDownloadSnapshot(snap, e)}
                            className="p-1 rounded hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-500 cursor-pointer transition-all"
                            title="下载摄影卡"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          
                          {/* Trash delete */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSnapshot(snap.id, e)}
                            className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 cursor-pointer transition-all"
                            title="删除本快照"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Zoom Preview Modal for Captured Polaroid post-card */}
      {selectedPreviewSnapshot && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in text-left"
          id="snapshot-preview-modal"
          onClick={() => setSelectedPreviewSnapshot(null)}
        >
          <div 
            className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-black/50 px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-white">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-bold font-mono">PANORAMA EXIF POSTCARD PREVIEW</span>
              </div>
              <button
                onClick={() => setSelectedPreviewSnapshot(null)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body Card view */}
            <div className="p-4 flex flex-col items-center justify-center bg-zinc-950/20">
              <div className="shadow-2xl max-w-full overflow-hidden rounded-xl border border-white/5 bg-neutral-900 max-h-[420px]">
                <img
                  src={selectedPreviewSnapshot.image}
                  alt={selectedPreviewSnapshot.title}
                  className="max-h-[380px] w-auto object-contain select-none mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <p className="text-[10px] text-gray-500 font-mono text-center mt-3">
                ☝️ 卡片底层印记包含镜片规格、对焦广角、俯仰及水平导航等全部专业摄影参数
              </p>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between bg-black/40 px-5 py-4 border-t border-white/5">
              <div className="flex flex-col text-xs text-left">
                <span className="text-white font-bold">{selectedPreviewSnapshot.title}</span>
                <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                  横航偏角: {selectedPreviewSnapshot.lon}° | 焦距: {selectedPreviewSnapshot.focalLength}mm | 光圈: f/{selectedPreviewSnapshot.aperture.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Apply back to Background as reference trigger */}
                <button
                  type="button"
                  onClick={() => {
                    renderStateRef.current.imageSrc = selectedPreviewSnapshot.rawImage;
                    renderStateRef.current.needsTextureLoad = true;
                    
                    // Recover coordinates and FOV zoom level cleanly
                    renderStateRef.current.lon = selectedPreviewSnapshot.lon;
                    renderStateRef.current.targetLon = selectedPreviewSnapshot.lon;
                    renderStateRef.current.lat = selectedPreviewSnapshot.lat;
                    renderStateRef.current.targetLat = selectedPreviewSnapshot.lat;
                    renderStateRef.current.fov = selectedPreviewSnapshot.fov;
                    setHudFov(selectedPreviewSnapshot.fov);
                    setSelectedLens(fovToFocalLength(selectedPreviewSnapshot.fov));
                    
                    setSelectedPreviewSnapshot(null);
                  }}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-250 hover:text-white text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center gap-1 border border-white/5"
                  title="把当前的2D截图贴入3D全景球体投影中"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>3D投影</span>
                </button>

                {/* Direct Download */}
                <button
                  type="button"
                  onClick={(e) => {
                    handleDownloadSnapshot(selectedPreviewSnapshot, e);
                    setSelectedPreviewSnapshot(null);
                  }}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-md hover:scale-[1.01]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载印记卡</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. Parameter / Slider Controls Panel for quick adjustment */}
      <div className={`p-4 rounded-xl border flex flex-col gap-3 ${
        theme === 'light'
          ? 'bg-slate-50 border-slate-200/60'
          : 'bg-black/20 border-white/5'
      }`} id="panorama-details-panel">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-purple-400" />
          <h4 className={`text-xs font-bold uppercase font-mono tracking-wider ${
            theme === 'light' ? 'text-slate-650' : 'text-gray-400'
          }`}>
            全景操控技巧与参数
          </h4>
        </div>
        <p className="text-[11px] text-gray-500 leading-normal">
          🌌 <strong>360°/720° 全景照片说明：</strong> 本查看器专为等距圆柱投影（Equirectangular projection）照片而设计。支持拖入或上传任意符合 2:1 宽高比的全景照片（如无人机航拍、全景相机照片）。加载后，照相机将被置于球心，重现无限全向视界。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono mt-1">
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase">全景联动导入工作流：</span>
            <span className="text-gray-500 leading-normal text-[11px]">
              • 您在左下方【渲染生成】新成果后，可点击上方「导入渲染图」，将生成的视角瞬间平铺至 3D 环抱空间中，检验大模型的光影透视！
            </span>
          </div>
          <div className="flex flex-col gap-1 text-left">
            <span className="text-[10px] text-gray-400 font-bold uppercase">焦距缩放 (Zoom) 秘籍：</span>
            <span className="text-gray-500 leading-normal text-[11px]">
              • 使用鼠标滚轮或拖拽可以产生 <strong>30° ~ 110°</strong> 的超宽视野差。在 30° 时宛如望远特写，而在 110° 广角时将具有明显的空间膨胀透视感。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
