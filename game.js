import * as THREE from 'three';

// --- 1. SETUP SCENE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Langit biru

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cahaya
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040, 2));

// --- 2. OBJEK GAME ---

// Jalan (Track)
const trackGeo = new THREE.PlaneGeometry(20, 2000);
const trackMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
const track = new THREE.Mesh(trackGeo, trackMat);
track.rotation.x = -Math.PI / 2;
scene.add(track);

// Mobil (Menggunakan Box sebagai placeholder)
const carGeo = new THREE.BoxGeometry(1.2, 0.6, 2.5);
const carMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const car = new THREE.Mesh(carGeo, carMat);
car.position.y = 0.3;
scene.add(car);

// Rintangan (Obstacles)
const obstacles = [];
function createObstacle(zPos) {
    const obsGeo = new THREE.BoxGeometry(2, 1, 2);
    const obsMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
    const obs = new THREE.Mesh(obsGeo, obsMat);
    obs.position.set(Math.random() * 10 - 5, 0.5, zPos);
    scene.add(obs);
    obstacles.push(obs);
}

// Buat beberapa rintangan di depan
for (let i = 1; i <= 10; i++) {
    createObstacle(-i * 30);
}

// --- 3. LOGIKA KONTROL ---
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
document.addEventListener('keydown', (e) => keys[e.code] = true);
document.addEventListener('keyup', (e) => keys[e.code] = false);

let speed = 0;
const maxSpeed = 0.5;
const acceleration = 0.01;
const friction = 0.96;
const turnSpeed = 0.04;

// --- 4. GAME LOOP ---
function update() {
    // Akselerasi
    if (keys.ArrowUp) speed += acceleration;
    if (keys.ArrowDown) speed -= acceleration;
    
    // Batasi kecepatan & gesekan
    speed *= friction;
    if (speed > maxSpeed) speed = maxSpeed;
    
    // Pergerakan Mobil
    car.translateZ(-speed);

    // Belok (Hanya jika mobil bergerak)
    if (Math.abs(speed) > 0.01) {
        if (keys.ArrowLeft) car.rotation.y += turnSpeed;
        if (keys.ArrowRight) car.rotation.y -= turnSpeed;
    }

    // Cek Tabrakan (Bounding Box)
    const carBox = new THREE.Box3().setFromObject(car);
    obstacles.forEach(obs => {
        const obsBox = new THREE.Box3().setFromObject(obs);
        if (carBox.intersectsBox(obsBox)) {
            console.log("BOOM! Tabrakan!");
            speed = -0.1; // Memantul sedikit
        }
    });

    // Kamera Mengikuti Mobil
    const offset = new THREE.Vector3(0, 3, 7); // Posisi kamera di belakang mobil
    const cameraPos = offset.applyMatrix4(car.matrixWorld);
    camera.position.lerp(cameraPos, 0.1); // Smooth camera follow
    camera.lookAt(car.position);
}

function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Handle Resize Jendela
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
