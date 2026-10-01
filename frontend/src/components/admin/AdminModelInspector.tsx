"use client";

import React, { Suspense, useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export interface AdminInspectorHandle {
  captureSnapshot: () => string | null;
}

interface InspectorModelProps {
  url: string;
  highlightedBodies: string[];
  groupedBodies: Record<string, string>;
  onMeshClick?: (bodyName: string) => void;
}

function InspectorModel({ url, highlightedBodies, groupedBodies, onMeshClick }: InspectorModelProps) {
  const { scene } = useGLTF(url);

  useMemo(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name;

        if (!Array.isArray(mesh.material)) {
          mesh.material = (mesh.material as THREE.Material).clone();
        }

        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (highlightedBodies.includes(name)) {
          mat.color.set("#F59E0B");
          mat.emissive.set("#D97706");
          mat.emissiveIntensity = 0.6;
        } else if (groupedBodies[name]) {
          mat.color.set(groupedBodies[name]);
          mat.emissive.set("#000000");
          mat.emissiveIntensity = 0;
        } else {
          mat.color.set("#FFFFFF");
          mat.emissive.set("#000000");
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [scene, highlightedBodies, groupedBodies]);

  return (
    <primitive
      object={scene}
      onClick={(e: any) => {
        e.stopPropagation();
        if (onMeshClick && e.object && e.object.name) {
          onMeshClick(e.object.name);
        }
      }}
    />
  );
}

interface AdminModelInspectorProps {
  file?: File | null;
  modelUrl?: string | null;
  highlightedBodies: string[];
  groupedBodies: Record<string, string>;
  onMeshClick?: (bodyName: string) => void;
}

const AdminModelInspector = forwardRef<AdminInspectorHandle, AdminModelInspectorProps>(
  ({ file, modelUrl, highlightedBodies, groupedBodies, onMeshClick }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const activeUrl = useMemo(() => {
      if (file) return URL.createObjectURL(file);
      if (modelUrl) return modelUrl;
      return null;
    }, [file, modelUrl]);

    useImperativeHandle(ref, () => ({
      captureSnapshot: () => {
        if (canvasRef.current) {
          return canvasRef.current.toDataURL("image/png");
        }
        return null;
      },
    }));

    if (!activeUrl) return null;

    return (
      <div className="w-full h-80 bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner border border-slate-800">
        <Canvas
          ref={canvasRef}
          gl={{ preserveDrawingBuffer: true }}
          shadows
          camera={{ position: [0, 2, 4], fov: 45 }}
        >
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.6}>
              <InspectorModel
                url={activeUrl}
                highlightedBodies={highlightedBodies}
                groupedBodies={groupedBodies}
                onMeshClick={onMeshClick}
              />
            </Stage>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
        <div className="absolute bottom-2 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-[11px] text-white">
          💡 A imagem de capa do card é gerada do ângulo em que a cadeira estiver posicionada
        </div>
      </div>
    );
  }
);

AdminModelInspector.displayName = "AdminModelInspector";
export default AdminModelInspector;