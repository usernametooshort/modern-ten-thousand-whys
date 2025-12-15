
import * as THREE from 'three';
import { Sky } from './Sky.js';

// --- Scene Setup ---
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000000);
camera.position.set(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Tone mapping is critical for the Sky shader to look good
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

// --- Sky Setup ---
const sky = new Sky();
sky.scale.setScalar(450000); // Make it huge
scene.add(sky);

const sun = new THREE.Vector3();
const skyUniforms = sky.material.uniforms;

skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 3;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.7;

// --- Stars Setup ---
const starsGroup = new THREE.Group();
scene.add(starsGroup);

const starsGeometry = new THREE.BufferGeometry();
const starsCount = 5000;
const starsPosArray = new Float32Array(starsCount * 3);

// Distribute particles on a sphere
for (let i = 0; i < starsCount; i++) {
    const r = 400000; // Inside skybox but far
    // Random spherical coordinates
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    starsPosArray[i * 3] = x;
    starsPosArray[i * 3 + 1] = y;
    starsPosArray[i * 3 + 2] = z;
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPosArray, 3));

const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 500, // Size in world units
    sizeAttenuation: true,
    transparent: true,
    opacity: 0 // Start hidden
});

const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
starsGroup.add(starsMesh);


// --- Location & Logic ---
let userLat = 31.2304; // Default Shanghai
let userLon = 121.4737;

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        updateEnvironment();
    }, (err) => {
        console.warn('Geolocation denied, using default.');
        updateEnvironment();
    });
} else {
    updateEnvironment();
}

function updateEnvironment() {
    const now = new Date();

    // 1. Calculate Sun Position (Simple Approx)

    // Day of year
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);

    // Time (Decimal Hours)
    // IMPORTANT: Sun calculations usually need Solar Time.
    // UTC calc + Lon offset is a good approx for Solar Time.
    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;

    // Declination (Season)
    const axisTilt = 23.44;
    const declination = axisTilt * Math.sin(2 * Math.PI * (day + 284) / 365);

    // Hour Angle (Time of day)
    // 15 degrees per hour. Solar Noon ~ 12:00.
    // solarTime = utcHours + (lon / 15)
    const solarTime = utcHours + (userLon / 15);
    const hourAngle = (solarTime - 12) * 15;

    // Elevation (Altitude)
    const latRad = THREE.MathUtils.degToRad(userLat);
    const decRad = THREE.MathUtils.degToRad(declination);
    const haRad = THREE.MathUtils.degToRad(hourAngle);

    const sinElevation = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    const elevation = THREE.MathUtils.radToDeg(Math.asin(sinElevation));

    // Azimuth
    const cosAzimuth = (Math.sin(decRad) - Math.sin(latRad) * sinElevation) / (Math.cos(latRad) * Math.cos(Math.asin(sinElevation)));
    // Clamp
    const clampedCosAz = Math.max(-1, Math.min(1, cosAzimuth));
    let azimuth = THREE.MathUtils.radToDeg(Math.acos(clampedCosAz));
    if (Math.sin(haRad) > 0) azimuth = 360 - azimuth;

    // 2. Set Sun Uniforms
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);

    // 3. Set Stars
    // If Elevation < 0, Sun is down.
    // Fade in stars as elevation drops from 5 to -10.
    let starOpacity = 0;
    if (elevation < 5) {
        starOpacity = THREE.MathUtils.mapLinear(elevation, 5, -10, 0, 1);
        starOpacity = Math.min(Math.max(starOpacity, 0), 1);
    }
    starsMaterial.opacity = starOpacity;

    // Star Rotation (Sidereal)
    // Approx Sidereal Time = UTC + Lon/15 + D*0.0657
    // This is rough but gives seasonal rotation.
    const gst = utcHours + 0.0657098244 * day + 6.6; // GST approx
    const lst = (gst + userLon / 15) % 24;

    // Rotation logic:
    // Earth spins around Pole. We want to rotate stars around Pole.
    // Axis of rotation = Celestial Pole.
    // In local coordinates (Y=Up, Z=North), Pole is at Altitude = Lat.

    // Reset
    starsGroup.rotation.set(0, 0, 0);

    // 1. Rotate stars around Celestial North Pole (Y axis in world space if we model it that way, but let's be simple)
    // Let's assume stars are defined in Celestial Coordinates (Frame aligned with Earth axis).
    // They rotate 15 deg/hr East-to-West (negative).
    const siderealAngle = THREE.MathUtils.degToRad(lst * 15);
    starsMesh.rotation.y = -siderealAngle; // Rotate stars around their own polar axis

    // 2. Align that polar axis to local observer
    // Rotate entire group around X to tilt North Pole to correct altitude.
    // At Lat 90, Pole is Y. At Lat 0, Pole is Z.
    // Rotation X = (90 - Lat)
    starsGroup.rotation.x = THREE.MathUtils.degToRad(90 - userLat);

    // Render
    renderer.render(scene, camera);
}
// --- UI Logic (Sidebar & I18n) ---
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

// Scroll to anchor smooth
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


// --- Animation Loop ---
let lastTime = 0;
function animate(time) {
    requestAnimationFrame(animate);

    const delta = time - lastTime;
    if (delta > 5000) { // Update astro logic every 5s
        updateEnvironment();
        lastTime = time;
    }

    // Gentle camera movement
    camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.05 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Interaction
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(0);
updateEnvironment(); // Initial call
