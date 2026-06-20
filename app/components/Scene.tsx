"use client";

import { useRef, useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── track list ───
const TRACKS = [
  { artist: "Ichiko Aoba", title: "ASLEEP", album: "qp", motif: "flower" as const, dur: 925 },
  { artist: "Frank Ocean", title: "PINK + WHITE", album: "BLOND", motif: "heart" as const, dur: 184 },
  { artist: "Frank Ocean", title: "WHITE FERRARI", album: "BLOND", motif: "car" as const, dur: 248 },
  { artist: "Ichiko Aoba", title: "0", album: "アオ", motif: "wave" as const, dur: 167 },
  { artist: "Frank Ocean", title: "SELF CONTROL", album: "BLOND", motif: "petal" as const, dur: 249 },
];

type Motif = (typeof TRACKS)[number]["motif"];

// ─── pixel art ───
const MOTIFS: Record<Motif, string[]> = {
  heart: ["............","..pp..pp....","pppppppp...",".pppppppp...",".pppppppp...","..pppppp....","...pppp.....","....pp......","............","...ww..ww...","............","............"],
  wave: ["............","............",".w........w.",".ww......ww.","..ww....ww..","...wwppww...","....wppw....","...wwppww...","..ww....ww..",".ww......ww.",".w........w.","............"],
  car: ["............","............","....wwww....","...wwwwwww..",".wwwwwwwwww.","wwwwwwwwwwww","wwwwwwwwwwww",".pp......pp.",".pp......pp.","............","............","............"],
  flower: ["............","....pp......","..p.pp.p....","..ppwwpp....",".pppwwppp...","..ppwwpp....","..p.pp.p....","....pp......","....ww......","....ww......","...w..w.....","............"],
  petal: ["............",".......pp...","......pppp..",".....pppp...","....pppp....","...pppp.....","..wppp......","..wpp.......","..pp........",".pp.........","............","............"],
};

function buildPixelShadows(rows: string[], px: number, cmap: Record<string, string>) {
  const shadows: string[] = [];
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === "." || ch === " ") continue;
      const col = cmap[ch];
      if (col) shadows.push(`${x * px}px ${y * px}px 0 0 ${col}`);
    }
  return shadows.join(", ");
}

function PixelArt({ motif, px, color }: { motif: Motif; px: number; color?: string }) {
  const rows = MOTIFS[motif] || MOTIFS.flower;
  let maxLen = 0;
  for (const r of rows) maxLen = Math.max(maxLen, r.length);
  return (
    <div
      style={{
        width: px, height: px,
        marginRight: maxLen * px - px,
        marginBottom: rows.length * px - px,
        boxShadow: buildPixelShadows(rows, px, { p: color || "#f0567f", w: "#d8b6c0" }),
      }}
    />
  );
}

function EqBars({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 15 }}>
      {[0, 0.3, 0.15, 0.45, 0.2].map((d, i) => (
        <div key={i} style={{
          width: 2.5, height: "100%", background: color, borderRadius: 1,
          transformOrigin: "bottom",
          animation: `wwEq ${0.8 + (i % 3) * 0.25}s ease-in-out infinite`,
          animationDelay: `${d}s`,
        }} />
      ))}
    </div>
  );
}

function fmt(s: number) {
  const m = (s / 60) | 0;
  return m + ":" + String(s % 60).padStart(2, "0");
}

// ─── glass iPod player with smooth animation ───
function Player({
  track, elapsed, playing, open,
  onToggleOpen, onTogglePlay, onPrev, onNext,
}: {
  track: (typeof TRACKS)[number]; elapsed: number; playing: boolean; open: boolean;
  onToggleOpen: () => void; onTogglePlay: () => void; onPrev: () => void; onNext: () => void;
}) {
  const prog = Math.min(1, elapsed / track.dur);
  const glass: React.CSSProperties = {
    background: "linear-gradient(155deg, rgba(255,255,255,0.72), rgba(255,248,251,0.5))",
    backdropFilter: "blur(30px) saturate(170%)",
    WebkitBackdropFilter: "blur(30px) saturate(170%)",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 22px 50px -26px rgba(150,110,135,0.32), inset 0 1px 0 rgba(255,255,255,0.95)",
  };

  return (
    <div style={{ position: "relative" }}>
      {/* collapsed pill */}
      <div
        onClick={onToggleOpen}
        style={{
          ...glass,
          display: "flex", alignItems: "center", gap: 13,
          padding: "10px 16px 10px 12px", borderRadius: 100,
          cursor: "pointer", width: 248,
          opacity: open ? 0 : 1,
          transform: open ? "scale(0.95) translateY(8px)" : "scale(1) translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          pointerEvents: open ? "none" : "auto",
        }}
      >
        <div style={{
          flex: "none", width: 30, height: 30, borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)",
        }}>
          <PixelArt motif={track.motif} px={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 600, fontSize: 12, color: "#392d33", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.01em" }}>
            {track.title}
          </div>
          <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 9, color: "#ab8a94", marginTop: 2 }}>
            {track.artist}
          </div>
        </div>
        <EqBars color="#f0567f" />
      </div>

      {/* expanded iPod */}
      <div style={{
        ...glass,
        position: "absolute", top: 0, right: 0,
        width: 232, borderRadius: 30, padding: "16px 16px 20px",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(-12px)",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: open ? "auto" : "none",
      }}>
        <div style={{ position: "absolute", top: "-30%", left: "-15%", width: "60%", height: "55%", background: "radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)", pointerEvents: "none" }} />
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative" }}>
          <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 8, letterSpacing: "0.32em", color: "#b29aa3" }}>wW · RADIO</span>
          <div onClick={onToggleOpen} style={{ cursor: "pointer", fontSize: 13, color: "#c1aab3", lineHeight: 1 }}>⌃</div>
        </div>
        {/* LCD */}
        <div style={{
          position: "relative", borderRadius: 14, padding: "13px 14px",
          background: "linear-gradient(165deg,#fbf5f7,#f2e9ed)",
          boxShadow: "inset 0 2px 6px rgba(150,120,135,0.18), inset 0 0 0 1px rgba(255,255,255,0.7)",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(120,90,105,0.04) 0, rgba(120,90,105,0.04) 1px, transparent 1px, transparent 3px)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
            <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 8, letterSpacing: "0.16em", color: "#c97d99" }}>{track.album}</span>
            <EqBars color="#ef9bb6" />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", position: "relative" }}>
            <div style={{ flex: "none", width: 52, height: 52, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", boxShadow: "inset 0 0 0 1px rgba(180,150,165,0.2)" }}>
              <PixelArt motif={track.motif} px={4} color="#ee5c84" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 7, letterSpacing: "0.2em", color: "#b29aa3", marginBottom: 5 }}>NOW PLAYING</div>
              <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 600, fontSize: 14, color: "#3a2d33", lineHeight: 1.05 }}>{track.title}</div>
              <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 9, color: "#e0698f", marginTop: 4 }}>{track.artist}</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 3, borderRadius: 3, background: "rgba(180,140,158,0.22)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, borderRadius: 3, background: "linear-gradient(90deg,#f7a9c1,#ee5c84)", transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--font-space-mono), monospace", fontSize: 8, color: "#b29aa3", fontVariantNumeric: "tabular-nums" }}>
              <span>{fmt(elapsed)}</span><span>{fmt(track.dur)}</span>
            </div>
          </div>
        </div>
        {/* click wheel */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <div style={{ position: "relative", width: 132, height: 132, borderRadius: "50%", background: "radial-gradient(circle at 50% 38%, #ffffff, #f4edf0 72%, #ece2e7 100%)", boxShadow: "0 8px 18px -8px rgba(160,125,140,0.5), inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -3px 8px rgba(175,145,160,0.2)" }}>
            <WheelBtn label="MENU" onClick={onToggleOpen} style={{ top: 9, left: 0, right: 0, height: 26, fontSize: 8, letterSpacing: "0.2em" }} />
            <WheelBtn label="◄◄" onClick={onPrev} style={{ left: 6, top: 0, bottom: 0, width: 34 }} />
            <WheelBtn label="►►" onClick={onNext} style={{ right: 6, top: 0, bottom: 0, width: 34 }} />
            <WheelBtn label={playing ? "❚❚" : "►"} onClick={onTogglePlay} style={{ bottom: 10, left: 0, right: 0, height: 24 }} />
            <div onClick={onTogglePlay} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle at 50% 40%, #fff, #f3ebee 82%)", boxShadow: "0 2px 8px -2px rgba(160,125,140,0.5), inset 0 1px 1px rgba(255,255,255,0.9)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ee5c84", fontSize: 11 }}>♥</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WheelBtn({ label, onClick, style }: { label: string; onClick: () => void; style: React.CSSProperties }) {
  return (
    <div onClick={onClick} style={{ position: "absolute", ...style, cursor: "pointer", fontFamily: "var(--font-space-mono), monospace", fontSize: 11, color: "#b29aa3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {label}
    </div>
  );
}

// ─── 3D: cherry blossom petal particles ───
function BlossomPetals({ treePosition }: { treePosition: [number, number, number] }) {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const petalData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        position: new THREE.Vector3(
          treePosition[0] + (Math.random() - 0.5) * 6,
          treePosition[1] + Math.random() * 5 + 1,
          treePosition[2] + (Math.random() - 0.5) * 6,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          -(0.2 + Math.random() * 0.4),
          (Math.random() - 0.5) * 0.3,
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1,
        ),
        phase: Math.random() * Math.PI * 2,
        scale: 0.04 + Math.random() * 0.06,
      });
    }
    return data;
  }, [treePosition]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const p = petalData[i];
      p.position.x += (p.velocity.x + Math.sin(p.position.y * 0.5 + p.phase) * 0.15) * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += (p.velocity.z + Math.cos(p.position.y * 0.3 + p.phase) * 0.1) * dt;
      p.rotation.x += p.rotSpeed.x * dt;
      p.rotation.y += p.rotSpeed.y * dt;
      p.rotation.z += p.rotSpeed.z * dt;

      if (p.position.y < -1) {
        p.position.set(
          treePosition[0] + (Math.random() - 0.5) * 5,
          treePosition[1] + 3 + Math.random() * 3,
          treePosition[2] + (Math.random() - 0.5) * 5,
        );
      }

      dummy.position.copy(p.position);
      dummy.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 0.6]} />
      <meshBasicMaterial
        color="#f4a8c0"
        side={THREE.DoubleSide}
        transparent
        opacity={0.65}
      />
    </instancedMesh>
  );
}

// ─── model transform state ───
type ModelTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

const DEFAULT_CAR: ModelTransform = { position: [0.9, -0.7, 5.9], rotation: [-0.12, 0.49, 0], scale: 3 };
const DEFAULT_TREE: ModelTransform = { position: [4.2, 0.2, 3.6], rotation: [0, 0.4, 0.01], scale: 2.8 };

// ─── 3D: pulsing glow sprite behind tree ───
function TreeGlow({ position }: { position: [number, number, number] }) {
  const matRef = useRef<THREE.SpriteMaterial>(null);
  const spriteRef = useRef<THREE.Sprite>(null);

  const glowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(244, 168, 192, 0.6)");
    gradient.addColorStop(0.3, "rgba(240, 130, 170, 0.25)");
    gradient.addColorStop(0.6, "rgba(253, 200, 220, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useFrame((state) => {
    if (!matRef.current || !spriteRef.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + Math.sin(t * 1.2) * 0.15 + Math.sin(t * 0.7) * 0.1;
    matRef.current.opacity = pulse;
    const s = 12 + Math.sin(t * 0.9) * 1.5;
    spriteRef.current.scale.set(s, s, 1);
  });

  return (
    <sprite ref={spriteRef} position={[position[0], position[1] + 2.5, position[2] - 1.5]}>
      <spriteMaterial ref={matRef} map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

// ─── 3D: Tree model ───
function TreeModel({ transform }: { transform: ModelTransform }) {
  const { scene } = useGLTF("/Meshy_AI_Pink_Pixel_Tree_0619123918_texture.glb");
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const bob = Math.sin(t * 0.8) * 0.15 + Math.sin(t * 1.3) * 0.05;
    groupRef.current.position.y = transform.position[1] + bob;
    groupRef.current.rotation.x = transform.rotation[0];
    groupRef.current.rotation.y = transform.rotation[1] + t * 0.12;
    groupRef.current.rotation.z = transform.rotation[2] + Math.sin(t * 0.5) * 0.015;
  });

  return (
    <group ref={groupRef} position={transform.position}>
      <primitive object={scene} scale={[transform.scale, transform.scale, transform.scale]} />
    </group>
  );
}

// ─── 3D: Car model ───
function CarModel({ transform }: { transform: ModelTransform }) {
  const { scene } = useGLTF("/Meshy_AI_White_Ferrari_Testaro_0619121237_texture.glb");

  const whiteScene = useMemo(() => {
    const cloned = scene.clone(true);
    const whiteMat = new THREE.MeshPhongMaterial({ color: 0xf2eced, shininess: 60, specular: 0x444444 });
    const darkMat = new THREE.MeshPhongMaterial({ color: 0x2a2226, shininess: 30 });
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const newMats = mats.map((raw) => {
          const m = raw as THREE.MeshStandardMaterial;
          const lum = m.color ? (m.color.r + m.color.g + m.color.b) / 3 : 0.5;
          if (lum < 0.15) return darkMat;
          return whiteMat;
        });
        mesh.material = newMats.length === 1 ? newMats[0] : newMats;
      }
    });
    return cloned;
  }, [scene]);

  return (
    <primitive
      object={whiteScene}
      position={transform.position}
      rotation={transform.rotation}
      scale={[transform.scale, transform.scale, transform.scale]}
    />
  );
}

// ─── 3D: scene with camera ───
function SceneContent({ carTransform = DEFAULT_CAR, treeTransform = DEFAULT_TREE }: { carTransform?: ModelTransform; treeTransform?: ModelTransform }) {
  const { camera } = useThree();
  const car = carTransform ?? DEFAULT_CAR;
  const tree = treeTransform ?? DEFAULT_TREE;

  useEffect(() => {
    camera.position.set(0.5, 3, 11);
    camera.lookAt(1.5, 1.5, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={1.6} color="#fff5f8" />
      <directionalLight position={[5, 10, 7]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-3, 8, 5]} intensity={0.8} color="#ffe0ec" />
      <directionalLight position={[0, 4, 8]} intensity={0.5} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#fde9f0", 0.8]} />
      <OrbitControls enablePan enableZoom enableRotate />
      <Suspense fallback={null}>
        <TreeGlow position={tree.position} />
        <CarModel transform={car} />
        <TreeModel transform={tree} />
        <BlossomPetals treePosition={tree.position} />
      </Suspense>
    </>
  );
}

// ─── debug controls panel ───
function TransformSlider({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 28, fontSize: 9, color: "#9a838e", textAlign: "right" }}>{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 100, accentColor: "#f0567f", height: 3, cursor: "pointer" }}
      />
      <span style={{ fontSize: 9, color: "#7a6670", fontVariantNumeric: "tabular-nums", width: 42 }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

function ModelControls({ label, transform, onChange, onReset }: {
  label: string;
  transform: ModelTransform;
  onChange: (t: ModelTransform) => void;
  onReset: () => void;
}) {
  const setPos = (i: number, v: number) => {
    const p: [number, number, number] = [...transform.position];
    p[i] = v;
    onChange({ ...transform, position: p });
  };
  const setRot = (i: number, v: number) => {
    const r: [number, number, number] = [...transform.rotation];
    r[i] = v;
    onChange({ ...transform, rotation: r });
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#392d33", letterSpacing: "0.1em" }}>{label}</span>
        <button
          onClick={onReset}
          style={{ fontSize: 8, color: "#b29aa3", background: "rgba(0,0,0,0.04)", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", letterSpacing: "0.1em" }}
        >
          RESET
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <TransformSlider label="X" value={transform.position[0]} onChange={(v) => setPos(0, v)} min={-15} max={15} step={0.1} />
        <TransformSlider label="Y" value={transform.position[1]} onChange={(v) => setPos(1, v)} min={-10} max={10} step={0.1} />
        <TransformSlider label="Z" value={transform.position[2]} onChange={(v) => setPos(2, v)} min={-15} max={15} step={0.1} />
        <TransformSlider label="rX" value={transform.rotation[0]} onChange={(v) => setRot(0, v)} min={-Math.PI} max={Math.PI} step={0.01} />
        <TransformSlider label="rY" value={transform.rotation[1]} onChange={(v) => setRot(1, v)} min={-Math.PI} max={Math.PI} step={0.01} />
        <TransformSlider label="rZ" value={transform.rotation[2]} onChange={(v) => setRot(2, v)} min={-Math.PI} max={Math.PI} step={0.01} />
        <TransformSlider label="S" value={transform.scale} onChange={(v) => onChange({ ...transform, scale: v })} min={0.5} max={10} step={0.1} />
      </div>
    </div>
  );
}

function DebugPanel({ car, tree, onCarChange, onTreeChange }: {
  car: ModelTransform; tree: ModelTransform;
  onCarChange: (t: ModelTransform) => void; onTreeChange: (t: ModelTransform) => void;
}) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const copyValues = () => {
    const out = `Car: pos=[${car.position.map(v => v.toFixed(2))}] rot=[${car.rotation.map(v => v.toFixed(2))}] scale=${car.scale.toFixed(2)}\nTree: pos=[${tree.position.map(v => v.toFixed(2))}] rot=[${tree.rotation.map(v => v.toFixed(2))}] scale=${tree.scale.toFixed(2)}`;
    navigator.clipboard.writeText(out).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  };

  return (
    <div style={{
      position: "absolute", bottom: "clamp(30px,5vh,54px)", left: "50%", transform: "translateX(-50%)",
      zIndex: 20, pointerEvents: "auto",
      fontFamily: "var(--font-space-mono), monospace",
    }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.9)", borderRadius: 100,
            padding: "8px 20px", cursor: "pointer", fontSize: 9,
            letterSpacing: "0.2em", color: "#9a838e",
            boxShadow: "0 8px 24px -12px rgba(170,120,145,0.3)",
          }}
        >
          CONTROLS
        </button>
      ) : (
        <div style={{
          background: "linear-gradient(155deg, rgba(255,255,255,0.85), rgba(255,248,251,0.75))",
          backdropFilter: "blur(30px) saturate(170%)", WebkitBackdropFilter: "blur(30px) saturate(170%)",
          border: "1px solid rgba(255,255,255,0.9)", borderRadius: 20,
          padding: "16px 20px", width: 260,
          boxShadow: "0 22px 50px -26px rgba(150,110,135,0.32)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 8, letterSpacing: "0.3em", color: "#b29aa3" }}>TRANSFORM</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={copyValues} style={{ fontSize: 8, color: "#b29aa3", background: "none", border: "none", cursor: "pointer" }}>
                {copied ? "✓ COPIED" : "COPY"}
              </button>
              <button onClick={() => setOpen(false)} style={{ fontSize: 11, color: "#c1aab3", background: "none", border: "none", cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
          </div>
          <ModelControls label="CAR" transform={car} onChange={onCarChange} onReset={() => onCarChange({ ...DEFAULT_CAR })} />
          <ModelControls label="TREE" transform={tree} onChange={onTreeChange} onReset={() => onTreeChange({ ...DEFAULT_TREE })} />
          <div style={{ fontSize: 8, color: "#cbb2bb", marginTop: 4, lineHeight: 1.5 }}>
            drag canvas to orbit camera<br />scroll to zoom · right-drag to pan
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2D: flipping grid + petal canvas overlays ───
type Petal2D = {
  x: number; y: number; vy: number; vx: number;
  rot: number; vr: number; ph: number;
  cube: boolean; s: number; a: number; c: string;
};

function mkPetal(W: number, H: number, seed: boolean): Petal2D {
  const colors = ["#ffd9e4", "#fbc7d6", "#f4afc4", "#fde9f0"];
  return {
    x: Math.random() * W, y: seed ? Math.random() * H : -20,
    vy: 0.32 + Math.random() * 0.6, vx: -0.35 + Math.random() * 0.45,
    rot: Math.random() * 6.28, vr: -0.03 + Math.random() * 0.06, ph: Math.random() * 6,
    cube: Math.random() < 0.5, s: 4 + Math.random() * 5,
    a: 0.4 + Math.random() * 0.35, c: colors[(Math.random() * 4) | 0],
  };
}

function useCanvasOverlays() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const petalRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal2D[]>([]);
  const flipsRef = useRef<{ gx: number; gy: number; life: number; max: number; pink: boolean }[]>([]);

  useEffect(() => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    petalsRef.current = Array.from({ length: 18 }, () => mkPetal(W(), H(), true));

    const sizeCanvases = () => {
      [bgRef, petalRef].forEach((r) => {
        const c = r.current;
        if (!c) return;
        c.width = W() * dpr;
        c.height = H() * dpr;
        c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    };
    sizeCanvases();

    const cell = 48;
    let last = performance.now();
    let raf: number;

    const loop = (t: number) => {
      const dt = Math.min(50, t - last);
      last = t;

      const bg = bgRef.current;
      if (bg) {
        const ctx = bg.getContext("2d")!;
        ctx.clearRect(0, 0, W(), H());
        ctx.strokeStyle = "rgba(60,40,52,0.03)";
        ctx.lineWidth = 1;
        for (let x = cell; x < W(); x += cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke(); }
        for (let y = cell; y < H(); y += cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W(), y); ctx.stroke(); }

        let flips = flipsRef.current;
        if (Math.random() < 0.4 && flips.length < 30) {
          flips.push({ gx: (Math.random() * (W() / cell)) | 0, gy: (Math.random() * (H() / cell)) | 0, life: 0, max: 50 + Math.random() * 70, pink: Math.random() < 0.32 });
        }
        flips.forEach((f) => (f.life += dt / 16));
        flipsRef.current = flips = flips.filter((f) => f.life < f.max);
        for (const f of flips) {
          const p = f.life / f.max;
          const sx = Math.abs(Math.cos(p * Math.PI));
          const a = Math.sin(p * Math.PI);
          ctx.save();
          ctx.translate(f.gx * cell + cell / 2, f.gy * cell + cell / 2);
          ctx.scale(Math.max(0.04, sx), 1);
          ctx.globalAlpha = a * (f.pink ? 0.35 : 0.4);
          ctx.fillStyle = f.pink ? "#f6b9cd" : "#ece6ea";
          ctx.fillRect(-cell / 2 + 3, -cell / 2 + 3, cell - 6, cell - 6);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      const pc = petalRef.current;
      if (pc) {
        const ctx = pc.getContext("2d")!;
        ctx.clearRect(0, 0, W(), H());
        for (const p of petalsRef.current) {
          p.x += (p.vx + Math.sin(p.y * 0.012 + p.ph) * 0.4) * (dt / 16);
          p.y += p.vy * (dt / 16);
          p.rot += p.vr * (dt / 16);
          if (p.y > H() + 20) Object.assign(p, mkPetal(W(), H(), false));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.a;
          if (p.cube) {
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.32);
          } else {
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.s * 0.6, p.s * 0.38, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("resize", sizeCanvases);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", sizeCanvases); };
  }, []);

  return { bgRef, petalRef };
}

// ─── main scene ───
export default function Scene() {
  const { bgRef, petalRef } = useCanvasOverlays();
  const [playerState, setPlayerState] = useState({ idx: 0, playing: true, open: false, elapsed: 14 });
  const [loaded, setLoaded] = useState(false);
  const [carTransform, setCarTransform] = useState<ModelTransform>({ ...DEFAULT_CAR });
  const [treeTransform, setTreeTransform] = useState<ModelTransform>({ ...DEFAULT_TREE });

  useEffect(() => {
    const id = setInterval(() => {
      setPlayerState((s) => ({
        ...s,
        elapsed: s.playing ? (s.elapsed + 1) % TRACKS[s.idx].dur : s.elapsed,
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const track = TRACKS[playerState.idx];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(130% 120% at 54% 30%, #ffffff 0%, #fffafc 52%, #fdf2f6 82%, #fbeef3 100%)",
      overflow: "hidden", fontFamily: "var(--font-space-mono), monospace", color: "#2a2226",
    }}>
      {/* bg grid canvas */}
      <canvas ref={bgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }} />

      {/* 3D scene */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>
        <Canvas
          gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
          style={{ background: "transparent" }}
          onCreated={() => setLoaded(true)}
        >
          <SceneContent carTransform={carTransform} treeTransform={treeTransform} />
        </Canvas>
      </div>

      {/* petal canvas overlay */}
      <canvas ref={petalRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 5, pointerEvents: "none" }} />

      {/* ── loading state ── */}
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(253,250,251,0.9)",
          transition: "opacity 0.6s ease",
        }}>
          <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 11, letterSpacing: "0.3em", color: "#cbb2bb" }}>
            LOADING
          </div>
        </div>
      )}

      {/* ── UI overlay ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>

        {/* TOP LEFT: pink square + title */}
        <div style={{ position: "absolute", top: "clamp(28px,4.4vh,48px)", left: "clamp(30px,3.4vw,56px)" }}>
          <span style={{ width: 13, height: 13, background: "#f0567f", display: "block", marginBottom: 14 }} />
          <h1 style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "clamp(28px,3.8vw,48px)", fontWeight: 600,
            lineHeight: 1, color: "#2a2226", margin: 0, letterSpacing: "-0.02em",
          }}>
            wWHIT<span style={{ fontStyle: "italic" }}>e</span>{" "}
            <span style={{ color: "#f0567f" }}>+</span> PINk
          </h1>
          {/* vertical kanji */}
          <div style={{
            writingMode: "vertical-rl",
            fontFamily: "var(--font-shippori), serif",
            fontSize: "clamp(13px,1.2vw,17px)", letterSpacing: "0.42em",
            color: "#d4c0c8", marginTop: 28, userSelect: "none",
          }}>
            白と桃色
          </div>
        </div>

        {/* TOP CENTER: nav glyphs */}
        <div style={{
          position: "absolute", top: "clamp(30px,4.4vh,48px)", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: 20, color: "#d6c5cc",
        }}>
          <span style={{ width: 9, height: 9, background: "#f7b9cb", display: "inline-block" }} />
          <span style={{ fontSize: 12 }}>▦</span>
          <span style={{ fontSize: 12 }}>◯</span>
          <span style={{ fontSize: 12 }}>✕</span>
        </div>

        {/* TOP RIGHT: iPod player */}
        <div style={{
          position: "absolute", top: "clamp(28px,4.4vh,46px)", right: "clamp(30px,3.4vw,56px)",
          display: "flex", flexDirection: "column", alignItems: "flex-end",
          pointerEvents: "auto",
        }}>
          <Player
            track={track} elapsed={playerState.elapsed} playing={playerState.playing} open={playerState.open}
            onToggleOpen={() => setPlayerState((s) => ({ ...s, open: !s.open }))}
            onTogglePlay={() => setPlayerState((s) => ({ ...s, playing: !s.playing }))}
            onPrev={() => setPlayerState((s) => ({ ...s, idx: (s.idx - 1 + TRACKS.length) % TRACKS.length, elapsed: 0 }))}
            onNext={() => setPlayerState((s) => ({ ...s, idx: (s.idx + 1) % TRACKS.length, elapsed: 0 }))}
          />
        </div>

        {/* BOTTOM LEFT: minimal caption */}
        <div style={{
          position: "absolute", bottom: "clamp(30px,5vh,54px)", left: "clamp(30px,3.4vw,56px)",
          fontFamily: "var(--font-space-mono), monospace", fontSize: 10,
          letterSpacing: "0.34em", color: "#cbb2bb", lineHeight: 1.9,
        }}>
          TESTAROSSA<br />· WHITE ·
        </div>

        {/* debug controls */}
        <DebugPanel
          car={carTransform} tree={treeTransform}
          onCarChange={setCarTransform} onTreeChange={setTreeTransform}
        />

        {/* BOTTOM RIGHT: ON AIR */}
        <div style={{ position: "absolute", bottom: "clamp(32px,5.2vh,56px)", right: "clamp(30px,3.4vw,58px)", pointerEvents: "auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "10px 20px", borderRadius: 100,
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 10px 24px -14px rgba(170,120,145,0.35)",
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f0567f", display: "inline-block", animation: "wwBlink 1.6s steps(1) infinite" }} />
            <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 10, letterSpacing: "0.36em", color: "#9a838e" }}>ON AIR</span>
          </div>
        </div>
      </div>
    </div>
  );
}
