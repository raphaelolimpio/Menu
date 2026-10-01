import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";

export async function extractBodiesFromGlb(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const loader = new GLTFLoader();

      loader.parse(
        arrayBuffer,
        "",
        (gltf) => {
          const bodies: string[] = [];
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              bodies.push(child.name);
            }
          });
          resolve(Array.from(new Set(bodies))); 
        },
        (error) => reject(error)
      );
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}