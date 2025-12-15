import * as THREE from 'three';

// --- Scene Setup ---
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Renderer setup
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

// --- Particles ---
const particlesGeometry = new THREE.BufferGeometry();
// Optimize for mobile: fewer particles
const isMobile = window.innerWidth < 768;
const particlesCount = isMobile ? 800 : 2000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    // Spread particles in a wide area
    posArray[i] = (Math.random() - 0.5) * 15;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

// Create a custom material for glowing dots
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0x00f3ff, // Cyan accent
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// Secondary particles (Stars far away)
const starsGeometry = new THREE.BufferGeometry();
const starsCount = isMobile ? 1000 : 3000;
const starsPosArray = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount * 3; i++) {
    starsPosArray[i] = (Math.random() - 0.5) * 30;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPosArray, 3));

const starsMaterial = new THREE.PointsMaterial({
    size: 0.015,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4
});

const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starsMesh);


// --- Interaction ---
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
});

// Scroll interaction
let scrollY = 0;
window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    // Smooth rotation
    particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
    particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

    // Constant slow rotation
    particlesMesh.rotation.y += 0.0005;
    starsMesh.rotation.y -= 0.0002;

    // Gentle floating
    particlesMesh.position.y = -scrollY * 0.0005;
    starsMesh.position.y = -scrollY * 0.0002;

    // Mouse parallax for camera
    camera.position.x += (mouseX * 0.0005 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.0005 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
}

animate();

// --- Resize Handling ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const isMobileResize = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileResize ? 1.5 : 2));
});


// --- UI Logic (Sidebar & I18n) ---
// Chapter Directory Toggle
const chapterToggles = document.querySelectorAll('.chapter-toggle');
chapterToggles.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = `nav-${button.dataset.target}`;
        const list = document.getElementById(targetId);
        if (!list) return;
        const isCollapsed = list.classList.toggle('collapsed');
        button.setAttribute('aria-expanded', (!isCollapsed).toString());
    });
});

// Scroll to anchor smooth (polyfill if needed, or JS enhancement)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});
