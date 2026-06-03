import * as THREE from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";

export interface LoadedModel {
  object: THREE.Object3D;
  maxDim: number;
  isMesh: boolean;
  hasColor: boolean;
  hasNormal: boolean;
  vertexCount: number;
  faceCount: number;
  pointMat: THREE.PointsMaterial | null;
  meshMat: THREE.MeshPhongMaterial | null;
}

export function loadPly(
  uri: string,
  onProgress: (pct: number) => void,
  onLoaded: (model: LoadedModel) => void,
  onError: (msg: string) => void,
): void {
  const loader = new PLYLoader();
  loader.load(
    uri,
    (geo) => onLoaded(processGeometry(geo)),
    (progress) => {
      if (progress.lengthComputable && progress.total > 0) {
        onProgress((progress.loaded / progress.total) * 100);
      }
    },
    (err) => onError(err instanceof Error ? err.message : String(err)),
  );
}

function processGeometry(geo: THREE.BufferGeometry): LoadedModel {
  geo.computeBoundingBox();
  geo.computeVertexNormals();

  const box = geo.boundingBox!;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geo.translate(-center.x, -center.y, -center.z);

  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.0001);

  const hasColor = geo.hasAttribute("color");
  const hasNormal = geo.hasAttribute("normal");
  const isMesh = geo.index !== null;

  let pointMat: THREE.PointsMaterial | null = null;
  let meshMat: THREE.MeshPhongMaterial | null = null;
  let object: THREE.Object3D;

  if (isMesh) {
    meshMat = new THREE.MeshPhongMaterial({
      vertexColors: hasColor,
      color: hasColor ? 0xffffff : 0x7799cc,
      specular: new THREE.Color(0x222222),
      shininess: 40,
      side: THREE.DoubleSide,
    });
    object = new THREE.Mesh(geo, meshMat);
  } else {
    pointMat = new THREE.PointsMaterial({
      size: maxDim * 0.005,
      vertexColors: hasColor,
      color: hasColor ? 0xffffff : 0x88aaff,
      sizeAttenuation: true,
    });
    object = new THREE.Points(geo, pointMat);
  }

  return {
    object,
    maxDim,
    isMesh,
    hasColor,
    hasNormal,
    vertexCount: geo.attributes.position.count,
    faceCount: isMesh ? geo.index!.count / 3 : 0,
    pointMat,
    meshMat,
  };
}
