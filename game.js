import * as THREE from 'three';

// --- INITIAL SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.Fog(0x050510, 10, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// --- MODEL FERRARI KUNING ---
const car = new THREE.Group();
const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.8, roughness: 0.2 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.6 });

const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 4), yellowMat);
body.position.y = 0.5;
car.add(body);

const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.8), glassMat);
cabin.position.set(0, 0.9, -0.2);
car.add(cabin);

// Headlights
const createLamp = (x) => {
    const lamp = new THREE.SpotLight(0xffffff, 25, 50, Math.PI/6, 0.4);
    lamp.position.set(x, 0.5, -2);
    lamp.target.position.set(x, 0.5, -10);
    car.add(lamp);
    car.add(lamp.target);
};
createLamp(0.6); createLamp(-0.6);

// Wheels
const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 12);
[[ -0.9, 0.4, 1.3], [0.9, 0.4, 1.3], [-0.9, 0.4, -1.3], [0.9, 0.4, -1.3]].forEach(pos => {
    const w = new THREE.Mesh(wheelGeo, blackMat);
    w.rotation.z = Math.PI/2;
    w.position.set(...pos);
    car.add(w);
});
scene.add(car);

// --- TRACK & OBSTACLES ---
const track = new THREE.Mesh(new THREE.PlaneGeometry(20, 10000), new THREE.MeshStandardMaterial({ color: 0x111111 }));
track.rotation.x = -Math.PI / 2;
scene.add(track);

const obstacles = [];
for(let i=1; i<50; i++) {
    const obs = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), new THREE.MeshStandardMaterial({color: 0xff0000}));
    obs.position.set(Math.random() * 14 - 7, 1, -i * 60);
    scene.add(obs);
    obstacles.push(obs);
}

// --- LOGIKA GAME & KONTROL ---
let speed = 0, score = 0;
const touch = { Up: false, Down: false, Left: false, Right: false };
const keys = {};

// Event Listeners
const setupBtn = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); touch[key] = true; initAudio(); });
    el.addEventListener('touchend', (e) => { e.preventDefault(); touch[key] = false; });
};
setupBtn('btnUp', 'Up'); setupBtn('btnDown', 'Down'); setupBtn('btnLeft', 'Left'); setupBtn('btnRight', 'Right');
window.onkeydown = (e) => keys[e.code] = true;
window.onkeyup = (e) => keys[e.code] = false;

// Audio
let audioCtx, osc;
function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start();
}

// Particles
const particles = [];
function updateParticles() {
    if (speed > 0.1) {
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.1), new THREE.MeshBasicMaterial({color:0x666666, transparent:true, opacity:0.5}));
        p.position.copy(car.position).add(new THREE.Vector3(0, 0, 2).applyQuaternion(car.quaternion));
        scene.add(p); particles.push(p);
    }
    particles.forEach((p, i) => {
        p.position.y += 0.05; p.material.opacity -= 0.02;
        if(p.material.opacity <= 0) { scene.remove(p); particles.splice(i, 1); }
    });
}

// --- ANIMATION LOOP ---
function animate() {
    requestAnimationFrame(animate);

    if (keys.ArrowUp || touch.Up) speed += 0.02;
    if (keys.ArrowDown || touch.Down) speed -= 0.01;
    speed *= 0.96;
    car.translateZ(-speed);

    if (Math.abs(speed) > 0.01) {
        if (keys.ArrowLeft || touch.Left) car.rotation.y += 0.05;
        if (keys.ArrowRight || touch.Right) car.rotation.y -= 0.05;
    }

    if(osc) osc.frequency.setTargetAtTime(60 + speed * 250, audioCtx.currentTime, 0.1);
    updateParticles();

    // Collision
    const carBox = new THREE.Box3().setFromObject(car);
    obstacles.forEach(obs => {
        if(carBox.intersectsBox(new THREE.Box3().setFromObject(obs))) speed = -0.1;
    });

    // Score & Camera
    score = Math.floor(Math.abs(car.position.z));
    document.getElementById('ui-layer').innerHTML = `SKOR: ${score}`;

    const camOffset = new THREE.Vector3(0, 3, 8).applyMatrix4(car.matrixWorld);
    camera.position.lerp(camOffset, 0.1);
    camera.lookAt(car.position);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
