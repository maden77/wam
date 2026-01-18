import * as THREE from 'three';

// --- INITIAL SETUP (SUASANA SIANG) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Langit biru cerah
scene.fog = new THREE.Fog(0x87CEEB, 50, 300);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Cahaya Siang Matahari
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// --- MODEL FERRARI KUNING ---
const car = new THREE.Group();
const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.5, roughness: 0.2 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5 });

const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 4), yellowMat);
body.position.y = 0.5;
car.add(body);

const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.8), glassMat);
cabin.position.set(0, 0.9, -0.2);
car.add(cabin);

// Ban
const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
[[-0.9, 0.4, 1.3], [0.9, 0.4, 1.3], [-0.9, 0.4, -1.3], [0.9, 0.4, -1.3]].forEach(pos => {
    const w = new THREE.Mesh(wheelGeo, blackMat);
    w.rotation.z = Math.PI/2;
    w.position.set(...pos);
    car.add(w);
});
scene.add(car);

// --- TRACK (ASPAL SIANG) ---
const track = new THREE.Mesh(new THREE.PlaneGeometry(20, 10000), new THREE.MeshStandardMaterial({ color: 0x444444 }));
track.rotation.x = -Math.PI / 2;
scene.add(track);

// Rumput di pinggir jalan
const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 10000), new THREE.MeshStandardMaterial({ color: 0x228b22 }));
grass.rotation.x = -Math.PI / 2;
grass.position.y = -0.01;
scene.add(grass);

const obstacles = [];
for(let i=1; i<50; i++) {
    const obs = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), new THREE.MeshStandardMaterial({color: 0xff3300}));
    obs.position.set(Math.random() * 14 - 7, 1, -i * 60);
    scene.add(obs);
    obstacles.push(obs);
}

// --- LOGIKA GAME & AUDIO ---
let speed = 0, gameStarted = false;
let audioCtx, osc, gainNode;
const touch = { Up: false, Down: false, Left: false, Right: false };

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    osc = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();
    osc.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Mulai dari senyap
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
}

// Menghilangkan Start Screen & Aktifkan Mesin
document.getElementById('start-screen').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    gameStarted = true;
    initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
});

// Setup Control Buttons
const setupBtn = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); touch[key] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); touch[key] = false; });
};
setupBtn('btnUp', 'Up'); setupBtn('btnDown', 'Down'); setupBtn('btnLeft', 'Left'); setupBtn('btnRight', 'Right');

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);
    if (!gameStarted) return;

    // Gerak
    if (touch.Up) speed += 0.02;
    if (touch.Down) speed -= 0.015;
    speed *= 0.96;
    car.translateZ(-speed);

    if (Math.abs(speed) > 0.01) {
        if (touch.Left) car.rotation.y += 0.05;
        if (touch.Right) car.rotation.y -= 0.05;
    }

    // Audio Update (Suara mesin mengikuti kecepatan)
    if (osc) {
        const pitch = 60 + (speed * 200);
        osc.frequency.setTargetAtTime(pitch, audioCtx.currentTime, 0.1);
        gainNode.gain.setTargetAtTime(speed > 0.01 ? 0.05 : 0.01, audioCtx.currentTime, 0.1);
    }

    // Camera & Render
    const camOffset = new THREE.Vector3(0, 3, 8).applyMatrix4(car.matrixWorld);
    camera.position.lerp(camOffset, 0.1);
    camera.lookAt(car.position);

    renderer.render(scene, camera);
}
animate();
