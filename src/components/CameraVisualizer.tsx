/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CameraParameters, ThemeMode } from '../types';

interface CameraVisualizerProps {
  params: CameraParameters;
  onChange: (newParams: Partial<CameraParameters>) => void;
  imageSrc: string | null;
  theme: ThemeMode;
}

export default function CameraVisualizer({
  params,
  onChange,
  imageSrc,
  theme,
}: CameraVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Use refs to make values accessible inside the Three.js loop without retriggering effect
  const paramsRef = useRef<CameraParameters>(params);
  paramsRef.current = params;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 500;
    const height = containerRef.current.clientHeight || 400;

    // 1. Initialize Scene & global viewport Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme === 'dark' ? 0x0f172a : 0xf8fafc);

    // 2. Setup standard viewing Camera for the user
    const viewCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    viewCamera.position.set(0, 4, 11);
    viewCamera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 3. Set up the structural outer rotation group to rotate the entire coordinate system with right click drag
    const globalSceneGroup = new THREE.Group();
    scene.add(globalSceneGroup);

    // 4. Create central Subject geometry (a stylish Cube)
    const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
    
    // Create face materials - we will dynamically update the front face with the uploaded image
    // In Three.js, box materials array order: [Right, Left, Top, Bottom, Front, Back]
    const defaultMaterials = Array.from({ length: 6 }, (_, i) => {
      // Different colors for faces to make it visually clear
      const colors = [0x546e7a, 0x455a64, 0x37474f, 0x263238, 0x1e293b, 0x0f172a];
      return new THREE.MeshStandardMaterial({
        color: colors[i],
        roughness: 0.3,
        metalness: 0.2,
      });
    });

    const subjectMesh = new THREE.Mesh(cubeGeometry, defaultMaterials);
    globalSceneGroup.add(subjectMesh);

    // Generate beautiful grid fallback texture for when there's no uploaded image
    const createFallbackTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw tech grid
        ctx.fillStyle = theme === 'dark' ? '#1e293b' : '#e2e8f0';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = theme === 'dark' ? '#fbbf24' : '#d97706';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 236, 236);
        
        ctx.fillStyle = theme === 'dark' ? '#fbbf24' : '#b45309';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Subject / 主体', 128, 128);
      }
      return new THREE.CanvasTexture(canvas);
    };

    const fallbackTexture = createFallbackTexture();
    // Default fallback mapping on front face (index 4 is front face of BoxGeometry)
    (defaultMaterials[4] as THREE.MeshStandardMaterial).map = fallbackTexture;
    (defaultMaterials[4] as THREE.MeshStandardMaterial).needsUpdate = true;

    // Load user image if present as texture on front face
    const textureLoader = new THREE.TextureLoader();
    if (imageSrc) {
      textureLoader.load(imageSrc, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        (defaultMaterials[4] as THREE.MeshStandardMaterial).map = texture;
        (defaultMaterials[4] as THREE.MeshStandardMaterial).color.setHex(0xffffff); // resetting mesh color
        (defaultMaterials[4] as THREE.MeshStandardMaterial).needsUpdate = true;
      });
    }

    // 5. Drawing horizontal Ring (Cyan) and vertical Ring (Pink) for spatial context
    // Horizontal circle ring in XZ plane
    const innerRadius = 3.5;
    const outerRadius = 3.52;
    const segments = 64;

    const horizRingGeo = new THREE.RingGeometry(innerRadius, outerRadius, segments);
    horizRingGeo.rotateX(Math.PI / 2); // align with XZ plane
    const horizRingMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee, // cyan
      side: THREE.DoubleSide
    });
    const horizRingMesh = new THREE.Mesh(horizRingGeo, horizRingMat);
    globalSceneGroup.add(horizRingMesh);

    // Cross horizontal ring ticks/grid representing orientation marks
    const gridHelper = new THREE.GridHelper(8, 8, 0x22d3ee, theme === 'dark' ? 0x334155 : 0xcbd5e1);
    gridHelper.position.y = -0.01;
    globalSceneGroup.add(gridHelper);

    // Vertical ring circle inside vertical space
    const vertRingGeo = new THREE.RingGeometry(innerRadius, outerRadius, segments);
    const vertRingMat = new THREE.MeshBasicMaterial({
      color: 0xec4899, // pink / magenta
      side: THREE.DoubleSide
    });
    const vertRingMesh = new THREE.Mesh(vertRingGeo, vertRingMat);
    // Rotate vertical ring around Y to point along viewing orientation
    globalSceneGroup.add(vertRingMesh);

    // 6. Creating Virtual Camera structure (Yellow)
    const virtualCamGroup = new THREE.Group();
    globalSceneGroup.add(virtualCamGroup);

    // Camera body (yellow box)
    const camBodyGeo = new THREE.BoxGeometry(0.5, 0.35, 0.35);
    const camBodyMat = new THREE.MeshStandardMaterial({
      color: 0xeab308, // amber/yellow
      roughness: 0.2,
      metalness: 0.5,
    });
    const camBody = new THREE.Mesh(camBodyGeo, camBodyMat);
    camBody.position.set(0, 0, 0);
    virtualCamGroup.add(camBody);

    // Camera Lens (small cylinder looking down -Z direction)
    const camLensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12);
    camLensGeo.rotateX(Math.PI / 2); // align cylinder length with Z-axis
    const camLensMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const camLens = new THREE.Mesh(camLensGeo, camLensMat);
    camLens.position.set(0, 0, -0.2);
    virtualCamGroup.add(camLens);

    // Dynamic Camera Frustum cone/pyramid extending from camera towards origin
    // Let's draw custom wireframe lines representing the field of view cone/pyramid
    const linesMaterial = new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 2 });
    const coneGroup = new THREE.Group();
    virtualCamGroup.add(coneGroup);

    // Update camera representations based on current parameters
    const updateVirtualCameraRepresentation = () => {
      const cParams = paramsRef.current;

      // Calculate camera position in spherical coordinates
      // Y is UP. Horizontal angle (degrees) maps to theta, Vertical angle maps to phi.
      const theta = (cParams.horizontalAngle * Math.PI) / 180;
      const phi = ((90 - cParams.verticalAngle) * Math.PI) / 180;
      const dist = cParams.distance;

      const posX = dist * Math.sin(phi) * Math.sin(theta);
      const posY = dist * Math.cos(phi);
      const posZ = dist * Math.sin(phi) * Math.cos(theta);

      virtualCamGroup.position.set(posX, posY, posZ);
      virtualCamGroup.lookAt(0, 0, 0);

      // Re-draw field-of-view lines reflecting digital zoom (which maps to Field of View angles)
      // Standard camera FOV is e.g. 45 degrees. FOV narrows as zoom increases.
      // FOV (deg) = 45 / digitalZoom
      const activeFovDeg = 45 / cParams.digitalZoom;
      const activeFovRad = (activeFovDeg * Math.PI) / 180;

      // Width of the box at the base (at origin, distance units away)
      const halfSize = dist * Math.tan(activeFovRad / 2);

      // Clear previous wireframes inside coneGroup
      while (coneGroup.children.length > 0) {
        const obj = coneGroup.children[0];
        coneGroup.remove(obj);
      }

      // Create a 4 lines array starting from (0,0,-0.3) (camera tip) to the 4 corners of the view screen at -Z = dist distance
      const baseDistance = -dist;
      const corners = [
        new THREE.Vector3(-halfSize, -halfSize, baseDistance),
        new THREE.Vector3(halfSize, -halfSize, baseDistance),
        new THREE.Vector3(halfSize, halfSize, baseDistance),
        new THREE.Vector3(-halfSize, halfSize, baseDistance),
      ];

      // Apex point of frustum (represented in local group space of the camera body)
      const apex = new THREE.Vector3(0, 0, -0.3);

      // Add the 4 edge lines of the pyramid
      corners.forEach((corner) => {
        const points = [apex, corner];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(lineGeo, linesMaterial);
        coneGroup.add(line);
      });

      // Add 4 lines to draw the rectangle boundary at the base
      for (let i = 0; i < 4; i++) {
        const nextIdx = (i + 1) % 4;
        const borderPoints = [corners[i], corners[nextIdx]];
        const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const borderLine = new THREE.Line(borderGeo, linesMaterial);
        coneGroup.add(borderLine);
      }
    };

    // Initial update of coordinates
    updateVirtualCameraRepresentation();

    // 7. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, theme === 'dark' ? 0.3 : 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, theme === 'dark' ? 0.6 : 1.0);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xbbf7d0, theme === 'dark' ? 0.2 : 0.4);
    dirLight2.position.set(-5, 2, -5);
    scene.add(dirLight2);

    // 8. Handle interactions (mouse events)
    let isDraggingLeft = false;
    let isDraggingRight = false;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (e: MouseEvent) => {
      // Get relative coordinates on click
      lastX = e.clientX;
      lastY = e.clientY;
      if (e.button === 0) {
        isDraggingLeft = true;
      } else if (e.button === 2) {
        isDraggingRight = true;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (isDraggingLeft) {
        // LEFT Drag: Adjust Virtual Camera Position (Spherical angles)
        // Adjust Horizontal angle
        let newH = paramsRef.current.horizontalAngle - deltaX * 0.5;
        // wrap to [-180, 180]
        while (newH > 180) newH -= 360;
        while (newH < -180) newH += 360;

        // Adjust Vertical angle
        let newV = paramsRef.current.verticalAngle + deltaY * 0.5;
        // clamp to [-90, 90]
        newV = Math.max(-89.9, Math.min(89.9, newV));

        onChangeRef.current({
          horizontalAngle: parseFloat(newH.toFixed(1)),
          verticalAngle: parseFloat(newV.toFixed(1)),
        });
      } else if (isDraggingRight) {
        // RIGHT Drag: Rotate overall viewport rendering grid scene
        globalSceneGroup.rotation.y += deltaX * 0.01;
        // Slight vertical constraint on overall scene tilting
        globalSceneGroup.rotation.x = Math.max(
          -Math.PI / 4,
          Math.min(Math.PI / 4, globalSceneGroup.rotation.x + deltaY * 0.01)
        );
      }
    };

    const onMouseUp = () => {
      isDraggingLeft = false;
      isDraggingRight = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Scroll: Adjust camera distance (Virtual focal length)
      const zoomFactor = e.deltaY * 0.01;
      let newDist = paramsRef.current.distance + zoomFactor;
      newDist = Math.max(2.0, Math.min(15.0, newDist));

      onChangeRef.current({
        distance: parseFloat(newDist.toFixed(1)),
      });
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // disable browsers right click popup inside 3D canvas
    };

    const canvasEl = canvasRef.current;
    canvasEl.addEventListener('mousedown', onMouseDown);
    canvasEl.addEventListener('wheel', onWheel, { passive: false });
    canvasEl.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 9. Resize observer to adapt container responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width: currentW, height: currentH } = entries[0].contentRect;
      if (currentW > 0 && currentH > 0) {
        viewCamera.aspect = currentW / currentH;
        viewCamera.updateProjectionMatrix();
        renderer.setSize(currentW, currentH);
      }
    });
    resizeObserver.observe(containerRef.current);

    // 10. Frame render Loop
    let animationFrameId: number;
    let runLoop = true;

    const animate = () => {
      if (!runLoop) return;
      animationFrameId = requestAnimationFrame(animate);

      // Smoothly tilt or rotate rings/ticks to match current virtual angle representation adjustments
      updateVirtualCameraRepresentation();

      // Dynamic scene elements (gentle floating effect for subject mesh to look lively!)
      subjectMesh.position.y = Math.sin(Date.now() * 0.001) * 0.1;

      // Keep pink vertical ring updated to always face the current camera theta direction, 
      // making it perfectly visible and aligned along the vertical slice of the camera position.
      const theta = (paramsRef.current.horizontalAngle * Math.PI) / 180;
      vertRingMesh.rotation.y = theta;

      renderer.render(scene, viewCamera);
    };

    animate();

    // 11. Cleanup routine
    return () => {
      runLoop = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvasEl.removeEventListener('mousedown', onMouseDown);
      canvasEl.removeEventListener('wheel', onWheel);
      canvasEl.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      
      // dispose Three assets
      cubeGeometry.dispose();
      horizRingGeo.dispose();
      vertRingGeo.dispose();
      horizRingMat.dispose();
      vertRingMat.dispose();
      camBodyGeo.dispose();
      camBodyMat.dispose();
      camLensGeo.dispose();
      camLensMat.dispose();
      linesMaterial.dispose();
      fallbackTexture.dispose();
      defaultMaterials.forEach((m) => m.dispose());
      renderer.dispose();
    };
  }, [imageSrc, theme]); // re-init on theme or image base changes

  return (
    <div className="relative w-full h-[380px] md:h-[450px] overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-200/20 dark:border-white/5" id="canvas-container">
      {/* Three.js Canvas */}
      <div ref={containerRef} className="w-full h-full">
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" id="webgl-canvas" />
      </div>

      {/* High-tech HUD Overlay for usage instructions */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none text-[11px] select-none" id="hud-instructions font-sans">
        <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/75 py-1 px-2.5 rounded-lg border border-white/5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#007aff]"></span>
          <span>左键拽：调相机角度 [水平/俯仰]</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/75 py-1 px-2.5 rounded-lg border border-white/5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#af52de]"></span>
          <span>右键拽：旋转 3D 观测空间景深</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300 bg-zinc-900/75 py-1 px-2.5 rounded-lg border border-white/5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#ea580c]"></span>
          <span>手势捏/滚轮：缩放摄影摄距景别</span>
        </div>
      </div>

      {/* Axis tags in 3D frame */}
      <div className="absolute bottom-4 right-4 pointer-events-none flex flex-row items-center gap-3 backdrop-blur-md bg-zinc-900/70 px-3 py-1.5 rounded-lg text-[10px] text-zinc-300 border border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#007aff] inline-block"></span>
          <span>水平轨迹</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#af52de] inline-block"></span>
          <span>仰俯轨迹</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ea580c] inline-block"></span>
          <span>相机视域</span>
        </div>
      </div>
    </div>
  );
}
