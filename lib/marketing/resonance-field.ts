// Resonance wave field — WebGL point-grid backdrop for the marketing site.
// Direct port of the "Resonance Site" Claude Design project's resonance-3d.js
// createField(), with three.js bundled instead of loaded from a CDN.
import * as THREE from "three"

export type ResonanceField = {
  canvas: HTMLCanvasElement
  time: () => number
  ripple: (x: number, z: number, amp: number) => void
  /** Returns 0..1 horizontal position if the tap hit the plane, else null. */
  pointerRipple: (clientX: number, clientY: number, amp?: number) => number | null
  update: (
    dt: number,
    opts?: { mouseX?: number; mouseY?: number; alpha?: number; amp?: number }
  ) => void
  resize: () => void
  dispose: () => void
}

export function createField(container: HTMLElement): ResonanceField {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
  })
  const DPR = Math.min(window.devicePixelRatio, 2)
  renderer.setPixelRatio(DPR)
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.set(0, 3.4, 7.6)

  const COLS = 216
  const ROWS = 126
  const W = 30
  const D = 17.5
  const N = COLS * ROWS
  const MAXS = 10
  const pos = new Float32Array(N * 3)
  let i = 0
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      pos[i * 3] = (c / (COLS - 1) - 0.5) * W
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = (r / (ROWS - 1) - 0.5) * D
      i++
    }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3))
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 1 },
    uAlpha: { value: 1 },
    uSrc: {
      value: Array.from({ length: MAXS }, () => new THREE.Vector4(0, 0, -99, 0)),
    },
  }
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime; uniform float uAmp; uniform vec4 uSrc[${MAXS}];
      varying float vA;
      void main(){
        vec3 p = position;
        float d0 = length(p.xz);
        float h = (0.30*sin(d0*0.9-uTime*1.15)*exp(-d0*0.05)
                + 0.10*sin(p.x*0.42+uTime*0.7)*cos(p.z*0.36-uTime*0.5)) * uAmp;
        float glow = 0.0;
        for(int k=0;k<${MAXS};k++){
          float age = uTime - uSrc[k].z;
          if(age>0.0 && age<7.0){
            float d = distance(p.xz, uSrc[k].xy);
            float front = age*3.1;
            float env = exp(-abs(d-front)*0.55)*exp(-age*0.55)*uSrc[k].w;
            h += env*sin(d*2.6-age*7.5);
            glow += env;
          }
        }
        p.y = h;
        vA = clamp(abs(h)*2.2 + glow*0.8, 0.0, 1.0);
        vec4 mv = modelViewMatrix*vec4(p,1.0);
        gl_PointSize = (1.1+vA*2.6)*(13.0/-mv.z)*${DPR.toFixed(1)};
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `
      varying float vA; uniform float uAlpha;
      void main(){
        float d = length(gl_PointCoord-0.5);
        float a = smoothstep(0.5,0.08,d);
        vec3 deep = vec3(0.203,0.184,0.412);
        vec3 mid  = vec3(0.569,0.518,0.851);
        vec3 hot  = vec3(0.902,0.898,0.929);
        vec3 col = mix(deep, mid, smoothstep(0.05,0.5,vA));
        col = mix(col, hot, smoothstep(0.55,1.0,vA));
        gl_FragColor = vec4(col, a*(0.13+vA*0.87)*uAlpha);
      }`,
  })
  scene.add(new THREE.Points(geo, mat))

  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const ndc = new THREE.Vector2()
  const hit = new THREE.Vector3()
  let si = 0
  let time = 0

  const api: ResonanceField = {
    canvas: renderer.domElement,
    time: () => time,
    ripple(x, z, amp) {
      uniforms.uSrc.value[si % MAXS].set(x, z, time, amp)
      si++
    },
    pointerRipple(clientX, clientY, amp = 1.1) {
      ndc.set(
        (clientX / window.innerWidth) * 2 - 1,
        -(clientY / window.innerHeight) * 2 + 1
      )
      ray.setFromCamera(ndc, camera)
      if (ray.ray.intersectPlane(plane, hit)) {
        api.ripple(hit.x, hit.z, amp)
        return Math.max(0, Math.min(1, hit.x / W + 0.5))
      }
      return null
    },
    update(dt, { mouseX = 0, mouseY = 0, alpha = 1, amp = 1 } = {}) {
      time += dt
      uniforms.uTime.value = time
      uniforms.uAmp.value += (amp - uniforms.uAmp.value) * 0.06
      uniforms.uAlpha.value += (alpha - uniforms.uAlpha.value) * 0.05
      camera.position.x += (mouseX * 1.6 - camera.position.x) * 0.04
      camera.position.y += (3.4 - mouseY * 1.2 - camera.position.y) * 0.04
      camera.lookAt(0, 0.1, 0)
      renderer.render(scene, camera)
    },
    resize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    },
    dispose() {
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      renderer.domElement.remove()
    },
  }
  return api
}
