"use client";

import React, { Suspense, forwardRef, useImperativeHandle, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Stage } from "@react-three/drei";
import * as THREE from "three";

export type FinishType = "standard" | "matte" | "glossy";

interface ModelProps {
  url: string;
  colors: Record<string, string>;
  finish: FinishType;
  customizableParts: any; 
}

function Model({ url, colors, finish, customizableParts }: ModelProps) {
  const { scene } = useGLTF(url);

  let roughness = 0.5;
  let metalness = 0.1;

  if (finish === "matte") {
    roughness = 0.9;
    metalness = 0.0;
  } else if (finish === "glossy") {
    roughness = 0.15;
    metalness = 0.2;
  }

  // Normalizar os grupos salvos no banco
  const groups: Array<{ name: string; bodies: string[] }> = Array.isArray(customizableParts)
    ? customizableParts
    : typeof customizableParts === "string"
    ? JSON.parse(customizableParts || "[]")
    : [];

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const meshName = mesh.name;

      if (!Array.isArray(mesh.material)) {
        mesh.material = (mesh.material as THREE.Material).clone();
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;

      // Procura se esse corpo pertence a algum grupo configurado
      const matchingGroup = groups.find((g) =>
        g.bodies.some((b) => b.toLowerCase() === meshName.toLowerCase())
      );

      if (matchingGroup) {
        // Assume a cor selecionada para o grupo pelo cliente
        const selectedColor = colors[matchingGroup.name] || "#111827";
        mat.color.set(selectedColor);
      } else {
        // Cor branca padrão para todas as outras peças não customizáveis
        mat.color.set("#FFFFFF");
      }

      mat.roughness = roughness;
      mat.metalness = metalness;
    }
  });

  return <primitive object={scene} />;
}

export interface ModelViewerHandle {
  captureSnapshot: () => string | null;
}

interface ViewerProps {
  modelUrl: string;
  selectedColors: Record<string, string>;
  finish?: FinishType;
  customizableParts?: any;
}

const ModelViewer = forwardRef<ModelViewerHandle, ViewerProps>(
  ({ modelUrl, selectedColors, finish = "standard", customizableParts = [] }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (canvasRef.current) {
          return canvasRef.current.toDataURL("image/png");
        }
        return null;
      },
    }));

    return (
      <div className="w-full h-[500px] bg-slate-900 rounded-2xl overflow-hidden shadow-inner relative">
        <Canvas
          ref={canvasRef}
          gl={{ preserveDrawingBuffer: true }}
          shadows
          camera={{ position: [0, 2, 5], fov: 45 }}
        >
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.6}>
              <Model
                url={modelUrl}
                colors={selectedColors}
                finish={finish}
                customizableParts={customizableParts}
              />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-white">
          Arraste para girar | Scroll para zoom
        </div>
      </div>
    );
  }
);

ModelViewer.displayName = "ModelViewer";
export default ModelViewer;