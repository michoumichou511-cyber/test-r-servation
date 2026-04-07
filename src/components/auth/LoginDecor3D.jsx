import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

/**
 * Décoration légère (wireframe, pas d’ombres / post-process) pour limiter la charge GPU.
 * Affiché uniquement sur desktop login, lazy-loadé, désactivé si prefers-reduced-motion (parent).
 */
function WireTorus() {
  const meshRef = useRef(null)
  useFrame((_, delta) => {
    const m = meshRef.current
    if (m) {
      m.rotation.x += delta * 0.08
      m.rotation.y += delta * 0.12
    }
  })
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.85, 0.22, 10, 24]} />
      <meshBasicMaterial color="#52FF8A" wireframe transparent opacity={0.4} />
    </mesh>
  )
}

export default function LoginDecor3D() {
  return (
    <div
      className="pointer-events-none absolute bottom-8 left-6 z-[5] hidden h-[140px] w-[140px] md:block"
      aria-hidden
    >
      <Canvas
        dpr={[1, 1.25]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        camera={{ position: [0, 0, 2.2], fov: 48 }}
      >
        <WireTorus />
      </Canvas>
    </div>
  )
}
