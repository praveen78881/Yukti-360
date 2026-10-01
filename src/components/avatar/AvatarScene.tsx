import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

import { FacePainter } from './faceCanvas';
import type { AvatarController } from './controller';

/* ============================================================================
   The 3D half. This module is the ONLY one that touches three / @react-three,
   and it is reached exclusively through a lazy import — the libraries are
   ~1MB and must never sit in the main bundle.

   Every shape here is generated in code: four primitives, one 2D canvas and a
   gradient sprite. No model file, no texture image; the geometry is a few
   kilobytes of parameters the GPU expands at runtime.
   ========================================================================== */

const TAU = Math.PI * 2;

/** The box the camera must always frame, whatever the panel's aspect. The orb is 2 across. */
const FIT = 3.5;
const FOV = 30;
const LOOK_AT = new THREE.Vector3(0, -0.12, 0);

/* Visor band: θ 1.12 → 1.66, a little above the equator. */
const VISOR_THETA_START = 1.12;
const VISOR_THETA_LEN = 0.54;

/* Face patch — phiLength 1.78 × thetaLength 1.06. φ = π/2 faces +Z (the
   camera), so the patch starts half its width before that. Vertically the
   patch is placed so the eye tops (canvas y 248 − 75 = 173) sit just inside the
   visor's upper edge: the key light's reflection lands right on that edge
   (θ ≈ 1.09 for this camera), and an eye that pokes above the matte band onto
   the glossy shell washes out. The mouth then rests at the band's lower edge,
   where the shell is black anyway. */
const FACE_PHI_LEN = 1.78;
const FACE_THETA_LEN = 1.06;
const FACE_PHI_START = Math.PI / 2 - FACE_PHI_LEN / 2;
const EYE_TOP = 173 / 600;
const EYE_INSET = 0.02; // radians inside the band
const FACE_THETA_START = VISOR_THETA_START + EYE_INSET - EYE_TOP * FACE_THETA_LEN;

/** The floor the shadow lies on (the orb's bottom rests near y = −1). */
const FLOOR_Y = -1.3;

export interface AvatarSceneProps {
  controller: AvatarController;
  /** false stops the render loop (scrolled away / hidden tab). */
  active?: boolean;
  /** Fired once, when the WebGL context exists. */
  onReady?: () => void;
  /** A click that actually lands on the orb (raycast), not just the canvas. */
  onOrbClick?: () => void;
}

export default function AvatarScene({ controller, active = true, onReady, onOrbClick }: AvatarSceneProps) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, 1.6]}
      // alpha + no scene background = whatever is behind the canvas shows through
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: FOV, near: 0.1, far: 60, position: [0, 1, 7] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.setClearColor(0x000000, 0);
        onReady?.();
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <CameraRig />
      <PointerGaze controller={controller} />
      <Lighting />
      <Orb controller={controller} onOrbClick={onOrbClick} />
    </Canvas>
  );
}

/* ── camera ────────────────────────────────────────────────────────────────
   The distance is derived from the FOV rather than hard-coded: fit vertically,
   fit horizontally, take whichever needs more room. The orb then frames
   identically in a wide dashboard card and a narrow header slot. */
function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  useLayoutEffect(() => {
    const aspect = width / Math.max(1, height);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV) / 2);
    const d = Math.max(FIT / 2 / tanHalf, FIT / 2 / (tanHalf * aspect));
    camera.fov = FOV;
    camera.aspect = aspect;
    camera.near = 0.1;
    camera.far = d * 4 + 10;
    // slightly above the eye line, so the floor shadow reads as an ellipse
    camera.position.set(0, d * 0.14, d);
    camera.lookAt(LOOK_AT);
    camera.updateProjectionMatrix();
  }, [camera, width, height]);

  return null;
}

/* ── gaze ──────────────────────────────────────────────────────────────────
   The eyes follow the pointer anywhere on the page, but the position is
   measured against the CANVAS's own rectangle rather than the window —
   otherwise the eyes are wrong everywhere except dead centre of the screen. */
function PointerGaze({ controller }: { controller: AvatarController }) {
  const el = useThree((s) => s.gl.domElement);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      controller.setPointer(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -(((e.clientY - r.top) / r.height) * 2 - 1),
      );
    };
    const onLeave = () => controller.clearPointer();
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [el, controller]);

  return null;
}

/* ── lighting ──────────────────────────────────────────────────────────────
   The gloss is almost entirely reflection, so the ENVIRONMENT does the work
   and the lights only keep the unlit side from crushing to nothing. */
function Lighting() {
  return (
    <>
      <Environment resolution={256} frames={1}>
        {/* The single soft highlight that reads as "polished". One source only —
            more panels smear recognisable rectangles across the sphere. */}
        <Lightformer form="circle" intensity={14} color="#ffffff" position={[3.4, 4.0, 3.0]} scale={[5, 5, 1]} />
        {/* Keeps the crown from going dead black. */}
        <Lightformer form="circle" intensity={1.0} color="#e8eef8" position={[-1.2, 5.2, 0.2]} scale={[6, 6, 1]} />
        {/* Floor bounce — the bright rim along the bottom edge. */}
        <Lightformer form="rect" intensity={0.55} color="#ffffff" position={[0, -4.4, 1.2]} scale={[5, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.35} />
      <directionalLight intensity={0.8} color="#ffffff" position={[3, 4, 4]} />
    </>
  );
}

/* ── the floor shadow ──────────────────────────────────────────────────────
   A stylised radial gradient, not a shadow map: one draw call, no
   light-dependent noise, and it can be driven straight off the float height. */
function useShadowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(10,18,32,0.55)');
    g.addColorStop(0.4, 'rgba(10,18,32,0.26)');
    g.addColorStop(0.75, 'rgba(10,18,32,0.06)');
    g.addColorStop(1, 'rgba(10,18,32,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

/* ── the orb ───────────────────────────────────────────────────────────── */
/* The point between the eyes, in the orb's local space: on the face patch at
   the eye row (canvas y 248) and straight ahead. The projector beam starts here. */
const EYE_THETA = FACE_THETA_START + (248 / 600) * FACE_THETA_LEN;
const EYE_POINT = new THREE.Vector3(0, 1.02 * Math.cos(EYE_THETA), 1.02 * Math.sin(EYE_THETA));
const scratch = new THREE.Vector3();

function Orb({ controller, onOrbClick }: { controller: AvatarController; onOrbClick?: () => void }) {
  const group = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const canvasEl = useThree((s) => s.gl.domElement);
  const faceMat = useRef<THREE.MeshBasicMaterial>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const shadowMat = useRef<THREE.MeshBasicMaterial>(null);
  const shadowTex = useShadowTexture();

  // The face is painted into a 2D canvas and mapped onto a curved patch of the
  // visor. The painter skips the repaint when nothing visible changed.
  const painter = useMemo(() => new FacePainter(), []);
  const faceTex = useMemo(() => {
    const t = new THREE.CanvasTexture(painter.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    // a texture re-uploaded most frames while talking — skip the mip chain
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    return t;
  }, [painter]);

  useEffect(() => () => { faceTex.dispose(); shadowTex.dispose(); }, [faceTex, shadowTex]);

  useFrame((_, dt) => {
    const f = controller.update(dt);

    const g = group.current;
    if (g) {
      g.position.set(f.body.x, f.body.y, f.body.z);
      // yaw first, then pitch, then roll — how a head actually turns
      g.rotation.set(f.body.pitch, f.body.yaw, f.body.roll, 'YXZ');
    }

    if (painter.paint(f.face)) faceTex.needsUpdate = true;

    // publish where the eyes are on screen (fractions of the canvas box)
    if (g) {
      scratch.copy(EYE_POINT);
      g.localToWorld(scratch).project(camera);
      controller.eyeAnchor.x = (scratch.x + 1) / 2;
      controller.eyeAnchor.y = (1 - scratch.y) / 2;
    }

    // glow gain rides the material colour: additive and un-tonemapped, so a
    // gain above 1 brightens the halo without a repaint
    faceMat.current?.color.setScalar(f.face.glowGain);

    // the shadow tightens and darkens as the orb settles, spreads and fades as it rises
    const lift = THREE.MathUtils.clamp((f.body.y + 0.08) / 0.16, 0, 1);
    if (shadow.current) {
      const s = 1.08 - lift * 0.18;
      shadow.current.scale.set(s, s, 1);
      shadow.current.position.x = f.body.x;
    }
    if (shadowMat.current) shadowMat.current.opacity = 1 - lift * 0.34;
  });

  return (
    <>
      {/* Pointer handlers sit on the group, so they fire only on a real
          raycast hit against the shell, visor, face or ear cups — never for
          the empty canvas around the orb. stopPropagation keeps one event per
          action even though the ray pierces several meshes. */}
      <group
        ref={group}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); controller.touchEnter(); canvasEl.style.cursor = onOrbClick ? 'pointer' : 'default'; }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); controller.touchLeave(); canvasEl.style.cursor = ''; }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); controller.touchPoke(); }}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOrbClick?.(); }}
      >
        {/* SHELL — glossy. Near-black, so what you read is purely reflection:
            clearcoat catches the one highlight and the floor rim. */}
        <mesh>
          <sphereGeometry args={[1, 96, 72]} />
          <meshPhysicalMaterial
            color="#0A0B0F"
            roughness={0.28}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.14}
            envMapIntensity={1.1}
          />
        </mesh>

        {/* VISOR — matte. The single most important relationship in the
            object: the visor REFUSES the reflections the shell catches, so it
            stays black and the glowing face has somewhere dark to sit. Raise
            envMapIntensity here and the face washes out. */}
        <mesh renderOrder={1}>
          <sphereGeometry args={[1.012, 96, 40, 0, TAU, VISOR_THETA_START, VISOR_THETA_LEN]} />
          <meshPhysicalMaterial
            color="#030407"
            roughness={0.78}
            metalness={0}
            clearcoat={0.1}
            envMapIntensity={0.07}
            // The brief leaves these two at their defaults, and the defaults break
            // the one relationship that matters: at grazing angles Fresnel pushes
            // specular toward 1, so even at envMapIntensity 0.07 the intensity-14 key
            // light smears a grey sheen across the band and the eyes wash out.
            // Damping the base specular and softening the thin clearcoat keeps the
            // visor refusing reflections, which is the whole point of it.
            specularIntensity={0.18}
            clearcoatRoughness={0.45}
          />
        </mesh>

        {/* FACE — additive, so the canvas's transparent areas genuinely vanish
            and the drawn shapes are emissive rather than lit. */}
        <mesh renderOrder={2}>
          <sphereGeometry args={[1.02, 64, 48, FACE_PHI_START, FACE_PHI_LEN, FACE_THETA_START, FACE_THETA_LEN]} />
          <meshBasicMaterial
            ref={faceMat}
            map={faceTex}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* EARS — capsules on their side, flattened into headphone cups. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.92, -0.05, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.82, 0.92]}>
            <capsuleGeometry args={[0.3, 0.06, 8, 40]} />
            <meshPhysicalMaterial color="#0C0D12" roughness={0.52} metalness={0} clearcoat={0.45} envMapIntensity={0.62} />
          </mesh>
        ))}
      </group>

      {/* FLOOR SHADOW — outside the group so it doesn't pitch with the head. */}
      <mesh ref={shadow} position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <planeGeometry args={[2.7, 2.7]} />
        <meshBasicMaterial ref={shadowMat} map={shadowTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}
