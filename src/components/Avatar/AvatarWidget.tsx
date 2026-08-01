'use client';

import { Bounds, Center, Gltf, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';

interface Props {
  /** Bewegung reduzieren (Systemeinstellung oder Nutzerwahl im A11y-Menü). */
  reduzierteBewegung?: boolean;
  /** Diagnose: zeigt zusätzlich einen pinken Referenzwürfel. */
  debug?: boolean;
}

/**
 * Reine 3D-Szene des Avatars.
 *
 * Diese Datei ist die EINZIGE mit three.js-Importen und wird ausschließlich
 * dynamisch geladen (siehe AvatarStage). Dadurch landet three.js nicht im
 * Start-Bundle der App, sondern wird erst geholt, wenn der Avatar wirklich
 * angezeigt wird.
 *
 * Positionierung, Fehlerbehandlung und Routen-Logik bewusst außerhalb —
 * hier steht nur die Szene.
 */
export default function AvatarWidget({ reduzierteBewegung = false, debug = false }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      // Das Modell ist noch statisch — „demand" zeichnet nur bei Bedarf statt
      // dauerhaft ~60 fps (spart CPU/Akku). OrbitControls stößt das Neuzeichnen
      // beim Drehen selbst an. Für echte Animationen später auf „always".
      frameloop={reduzierteBewegung ? 'demand' : 'always'}
      // Im Diagnose-Modus undurchsichtig, damit die Canvas-Fläche selbst
      // sichtbar wird; sonst transparent, damit die Seite durchscheint.
      gl={{ alpha: !debug }}
    >
      {/* DIAGNOSE-STUFE 1 — grüne Canvas-Fläche.
          Sichtbar = WebGL rendert überhaupt. Nicht sichtbar = der Canvas
          zeichnet nichts (Initialisierung/Kontext), unabhängig von Modell,
          Kamera und Licht. */}
      {debug && <color attach="background" args={['#0b3d2e']} />}

      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />

      {/* DIAGNOSE-STUFE 2 — pinker Würfel an einer festen, garantiert
          sichtbaren Position. Sichtbar = Kamera und Beleuchtung stimmen,
          ein fehlender Avatar liegt dann allein am Modell. */}
      {debug && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff00aa" />
        </mesh>
      )}

      <Suspense fallback={null}>
        {/* Das Modell ist Draco-komprimiert. Der Decoder wird bewusst LOKAL
            aus /public/draco geladen statt vom Google-CDN (gstatic.com):
            das vermeidet einen Drittanbieter-Abruf mit IP-Übertragung
            (DSGVO) und passt zur strikten CSP (connect-src 'self'). */}
        {debug ? (
          // Im Diagnose-Modus ohne Bounds: dessen `clip` verändert die
          // Kamera-Ebenen und könnte die Szene komplett wegschneiden — das
          // soll den Test nicht verfälschen.
          <Center>
            <Gltf src="/models/navi_avatar.glb" useDraco="/draco/" scale={0.5} />
          </Center>
        ) : (
          // Bounds+Center rahmen das Modell automatisch ein, unabhängig von
          // seinen Maßen.
          <Bounds fit clip observe margin={1.2}>
            <Center>
              <Gltf src="/models/navi_avatar.glb" useDraco="/draco/" />
            </Center>
          </Bounds>
        )}
      </Suspense>

      {/* Zum Ausprobieren: Modell mit der Maus drehen. */}
      <OrbitControls enableZoom={false} makeDefault />
    </Canvas>
  );
}
