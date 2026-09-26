/* The home hero: shape No. 09, built in 3D from its outline traced off the
   owner's own photo, shown in six colours on a stone shelf. One real shape
   repeated, so there is no guessing at sizes between different bottles.
   If WebGL is missing or fails, the poster image underneath stays. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';


/* (radius, height) with the bottle 1 unit tall, traced from photos/9bd4995f... */
const BASE = [[0,0],[0.1301,0],[0.1426,0.0098],[0.1478,0.0157],[0.1509,0.0216],[0.1522,0.0295],[0.1523,0.7191]];
const TOP  = [[0.1523,0.7191],[0.1511,0.7583],[0.1499,0.7662],[0.1457,0.7819],[0.1421,0.7917],[0.1373,0.7996],
  [0.1271,0.8134],[0.1038,0.8389],[0.0823,0.8585],[0.0791,0.8625],[0.0773,0.8664],[0.0768,0.8821],
  [0.0803,0.8998],[0.0774,0.9194],[0.0776,0.947],[0.0765,0.9862],[0.0765,1.0]];
const WALL = 0.006, FLOOR = 0.022;               /* plastic wall and base thickness */
const WALL_W = 14, WALL_H = 7, WALL_TOP = 4.9;   /* the plaster wall behind the shelf */
const SPACING = 0.42;

/* left to right, lightest to darkest */
const FINISHES = ['clear', 'white', 'blue', 'green', 'amber', 'black'];

function outline() {
  const v = (p) => new THREE.Vector2(p[0], p[1]);
  /* the shoulder and neck as one smooth curve; the body stays a straight line */
  const top = new THREE.SplineCurve(TOP.map(v)).getPoints(90);
  return BASE.map(v).concat(top.slice(1));
}

/* outside up to the lip, then back down the inside: a hollow bottle with real walls */
function shell() {
  const out = outline();
  const pts = out.slice();
  for (let i = out.length - 1; i >= 1; i--) {
    const p = out[i];
    if (p.y < FLOOR) break;
    pts.push(new THREE.Vector2(Math.max(p.x - WALL, 0.002), p.y));
  }
  pts.push(new THREE.Vector2(0.002, FLOOR));
  return new THREE.LatheGeometry(pts, 144);
}

function material(kind) {
  /* PET: glassy surface, light bending through it, and a clearcoat for the crisp edge highlights */
  const clear = { transmission: 1, roughness: 0.02, ior: 1.52, thickness: 0.28, specularIntensity: 1,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6 };
  switch (kind) {
    case 'clear': return new THREE.MeshPhysicalMaterial({ ...clear, color: 0xffffff, attenuationColor: new THREE.Color('#f4f7f6'), attenuationDistance: 6 });
    case 'blue':  return new THREE.MeshPhysicalMaterial({ ...clear, color: 0xffffff, attenuationColor: new THREE.Color('#6aa8d8'), attenuationDistance: 1.3 });
    case 'green': return new THREE.MeshPhysicalMaterial({ ...clear, color: 0xffffff, attenuationColor: new THREE.Color('#3f9460'), attenuationDistance: 1.0 });
    case 'amber': return new THREE.MeshPhysicalMaterial({ ...clear, color: 0xffffff, attenuationColor: new THREE.Color('#7a2f08'), attenuationDistance: 0.3 });
    case 'white': return new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#f2f0eb'), roughness: 0.55, sheen: 0.4, sheenRoughness: 0.8 });
    default:      return new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#141414'), roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.35 });
  }
}

/* soft round shadow under each bottle, drawn once into a small texture */
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  r.addColorStop(0, 'rgba(40,30,20,.55)'); r.addColorStop(.55, 'rgba(40,30,20,.18)'); r.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* plaster wall with daylight falling off from the left */
function wallTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const lin = g.createLinearGradient(0, 0, 512, 0);
  lin.addColorStop(0, '#dcd7cf'); lin.addColorStop(.5, '#d3cdc4'); lin.addColorStop(1, '#c4bdb3');
  g.fillStyle = lin; g.fillRect(0, 0, 512, 256);
  /* window light falling on the wall behind the row, with the frame's bars in it.
     The wall is WALL_W by WALL_H units, so these are placed in wall units. */
  const u = 512 / WALL_W, X = (x) => (x + WALL_W / 2) * u, Y = (y) => (WALL_TOP - y) * u;
  g.save();
  g.filter = 'blur(6px)';
  g.fillStyle = 'rgba(255,249,238,.6)';
  g.beginPath();
  g.moveTo(X(-1.9), Y(2.1)); g.lineTo(X(0.6), Y(2.1)); g.lineTo(X(1.5), Y(0.15)); g.lineTo(X(-1.0), Y(0.15));
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(150,140,128,.5)'; g.lineWidth = 0.07 * u;
  g.beginPath(); g.moveTo(X(-0.65), Y(2.1)); g.lineTo(X(0.25), Y(0.15)); g.stroke();
  g.beginPath(); g.moveTo(X(-1.45), Y(1.15)); g.lineTo(X(1.05), Y(1.15)); g.stroke();
  g.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function start(host) {
  const canvas = host.querySelector('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d8d3cb');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* daylight from a window on the left */
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.6);
  sun.position.set(-3, 3, 2.5); scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc2, 0.35));
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(3, 2.2, -2.5); scene.add(rim);

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W, WALL_H), new THREE.MeshStandardMaterial({ map: wallTexture(), roughness: 1 }));
  wall.position.set(0, WALL_TOP - WALL_H / 2, -0.85); scene.add(wall);

  const n = FINISHES.length, rowW = (n - 1) * SPACING;
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(rowW + 3.2, 0.2, 1.35),
    new THREE.MeshStandardMaterial({ color: new THREE.Color('#e7e2d9'), roughness: 0.92 }));
  shelf.position.set(0, -0.1, 0.05); scene.add(shelf);

  const geo = shell();
  const shadowTex = shadowTexture();
  const bottles = [];
  FINISHES.forEach((kind, i) => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(geo, material(kind));
    g.add(m);
    /* screw threads as fine rings on the neck */
    for (const y of [0.922, 0.94, 0.958]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0786, 0.0026, 10, 96), m.material);
      ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring);
    }
    const dark = kind === 'black' ? 1 : kind === 'white' ? 0.85 : 0.6;
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: dark, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(0.08, 0.001, 0.02);
    g.add(sh);
    g.position.x = -rowW / 2 + i * SPACING;
    g.rotation.y = i * 0.9;
    scene.add(g); bottles.push(g);
  });

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 0.46, 0);
  let W = 1, H = 1, dist = 5, wide = true;

  function layout() {
    const r = host.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    const aspect = W / H, t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    wide = aspect > 1.05;
    /* the row takes about half the width beside the headline, or most of it on a phone */
    const across = wide ? 0.5 : 0.9, tall = wide ? 0.5 : 0.3;
    const rowSpan = rowW + 0.32;
    dist = Math.max(rowSpan / (across * 2 * t * aspect), 1 / (tall * 2 * t));
    camera.aspect = aspect;
    /* a shift lens: move the picture, not the camera, so the bottles stay upright */
    if (wide) camera.setViewOffset(W, H, -W * 0.2, -H * 0.05, W, H);
    else camera.setViewOffset(W, H, 0, -H * 0.24, W, H);
    camera.updateProjectionMatrix();
  }

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let px = 0, py = 0, sx = 0, sy = 0, visible = true, started = performance.now(), last = started, shown = false;
  host.addEventListener('pointermove', (e) => {
    const r = host.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - 0.5; py = (e.clientY - r.top) / r.height - 0.5;
  });
  host.addEventListener('pointerleave', () => { px = 0; py = 0; });

  const ease = (x) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 4);

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const t = (now - started) / 1000;
    const intro = still ? 1 : ease(t / 2.6);
    sx += (px - sx) * 0.05; sy += (py - sy) * 0.05;
    const sway = still ? 0 : Math.sin(t * Math.PI * 2 / 18) * 0.07;
    const ang = sway + sx * 0.12;
    const d = dist * (1.18 - 0.18 * intro);
    const h = 0.62 + (1 - intro) * 0.35 - sy * 0.12;
    camera.position.set(Math.sin(ang) * d, h, Math.cos(ang) * d);
    camera.lookAt(target);
    if (!still) bottles.forEach((b, i) => { b.rotation.y += dt * (0.18 + i * 0.015); });
    renderer.render(scene, camera);
    if (!shown) { shown = true; host.classList.add('live'); }
  }

  function loop(now) {
    if (!visible) return;
    frame(now);
    if (!still) requestAnimationFrame(loop);
  }

  layout();
  new ResizeObserver(() => { layout(); if (still) frame(performance.now()); }).observe(host);
  new IntersectionObserver((es) => {
    const was = visible; visible = es[0].isIntersecting && !document.hidden;
    if (visible && !was) { last = performance.now(); requestAnimationFrame(loop); }
  }).observe(host);
  document.addEventListener('visibilitychange', () => {
    const was = visible; visible = !document.hidden;
    if (visible && !was) { last = performance.now(); requestAnimationFrame(loop); }
  });
  requestAnimationFrame(loop);
}

/* started last, once every constant above exists */
const host = document.getElementById('hero3d');
if (host) start(host);
