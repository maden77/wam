import * as THREE from 'three';

// --- 1. UI & SETUP SCENE ---
const scoreElement = document.createElement('div');
scoreElement.style = "position:absolute; top:20px; left:20px; color:white; font-size:28px; font-family:Arial; font-weight:bold; text-shadow: 2px 2px 4px #000; z-index:100;";
scoreElement.innerHTML = 'SKOR: 0';
document.body.appendChild(scoreElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510); // Malam gelap
scene.fog = new THREE.Fog(0x050510, 10, 150);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cahaya Lingkungan
scene.add(new THREE.AmbientLight(0x404040, 0.5));

// --- 2. MEMBUAT FERRARI KUNING ---
const car = new THREE.Group();

const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.7, roughness: 0.2 });
const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x222222, transparent: true, opacity: 0.6 });

// Body
const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 4), yellowMat);
body.position.y = 0.4;
car.add(body);

const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.5), glassMat);
cabin.position.set(0, 0.8, 0);
car.add(cabin);

// Lampu Depan (Visual)
const lightMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), new THREE.MeshBasicMaterial({color: 0xffffff}));
lightMesh.position.set(0.5, 0.4, -2);
car.add(lightMesh.clone());
lightMesh.position.x = -0.5;
car.add(lightMesh);

// Spotlights (Cahaya Nyata)
const createHeadlight = (x) => {
    const light = new THREE.SpotLight(0xffffff, 20, 40, Math.PI/6, 0.3);
    light.position.set(x, 0.5, -2);
    light.target.position.set(x, 0.5, -10);
    car.add(light);
    car.add(light.target);
};
createHeadlight(0.6);
createHeadlight(-0.6);

// Ban
const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);
const wheelPos = [[-0.85, 0.35, 1.3], [0.85, 0.35, 1.3], [-0.85, 0.35, -1.3], [0.85, 0.35, -1.3]];
wheelPos.forEach(pos => {
    const w = new THREE.Mesh(wheelGeo, blackMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(pos[0], pos[1], pos[2]);
    car.add(w);
});

scene.add(car);

// --- 3. JALAN & RINTANGAN ---
const track = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 10000),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
);
track.rotation.x = -Math.PI / 2;
scene.add(track);

const obstacles = [];
for(let i=1; i<50; i++) {
    const obs = new THREE.Mesh(new THREE.BoxGeometry(3, 1.5, 3), new THREE.MeshStandardMaterial({color: 0xff3300}));
    obs.position.set(Math.random() * 14 - 7, 0.75, -i * 60);
    scene.add(obs);
    obstacles.push(obs);
}

// --- 4. SISTEM PARTIKEL ASAP ---
const particles = [];
function createSmoke() {
    if (speed > 0.1) {
        const pGeo = new THREE.SphereGeometry(Math.random() * 0.2, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.4 });
        const p = new THREE.Mesh(pGeo, pMat);
        const pos = new THREE.Vector3(0, 0.3, 2).applyMatrix4(car.matrixWorld);
        p.position.copy(pos);
        scene.add(p);
        particles.push(p);
    }
}

// --- 5. AUDIO MESIN ---
let audioCtx, oscillator;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(50, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
}

// --- 6. LOGIKA GAME ---
let speed = 0, score = 0;
const keys = {};
window.onkeydown = (e) => { 
    keys[e.code] = true; 
    if(!audioCtx) initAudio(); 
    if(audioCtx?.state === 'suspended') audioCtx.resume();
};
window.onkeyup = (e) => keys[e.code] = false;

function animate() {
    requestAnimationFrame(animate);

    // Gerak
    if (keys.ArrowUp) speed += 0.015;
    if (keys.ArrowDown) speed -= 0.01;
    speed *= 0.97; // Gesekan
    car.translateZ(-speed);

    if (Math.abs(speed) > 0.01) {
        if (keys.ArrowLeft) car.rotation.y += 0.04;
        if (keys.ArrowRight) car.rotation.y -= 0.04;
    }

    // Update Asap & Suara
    createSmoke();
    particles.forEach((p, i) => {
        p.position.y += 0.02;
        p.material.opacity -= 0.01;
        if(p.material.opacity <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    });
    if(oscillator) oscillator.frequency.setTargetAtTime(50 + speed * 300, audioCtx.currentTime, 0.1);

    // Tabrakan & Skor
    score = Math.floor(Math.abs(car.position.z));
    scoreElement.innerHTML = `SKOR: ${score}`;

    const carBox = new THREE.Box3().setFromObject(car);
    obstacles.forEach(obs => {
        if(carBox.intersectsBox(new THREE.Box3().setFromObject(obs))) {
            speed = -0.2; // Pantul
            scoreElement.style.color = 'red';
            setTimeout(() => scoreElement.style.color = 'white', 200);
        }
    });

    // Kamera
    const camPos = new THREE.Vector3(0, 3, 8).applyMatrix4(car.matrixWorld);
    camera.position.lerp(camPos, 0.1);
    camera.lookAt(car.position);

    renderer.render(scene, camera);
}

animate();
