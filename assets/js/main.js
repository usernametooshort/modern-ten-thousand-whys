
import * as THREE from 'three';

// --- Sky Shader definition (Inlined for reliability) ---
const Sky = function () {
    const shader = SkyShader;
    const material = new THREE.ShaderMaterial({
        name: 'SkyShader',
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: THREE.UniformsUtils.clone(shader.uniforms),
        side: THREE.BackSide,
        depthWrite: false
    });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.isSky = true;
    return mesh;
};

const SkyShader = {
    uniforms: {
        'turbidity': { value: 10 },
        'rayleigh': { value: 2 },
        'mieCoefficient': { value: 0.005 },
        'mieDirectionalG': { value: 0.8 },
        'sunPosition': { value: new THREE.Vector3() },
        'up': { value: new THREE.Vector3(0, 1, 0) }
    },
    vertexShader: `
        uniform vec3 sunPosition;
        uniform float rayleigh;
        uniform float turbidity;
        uniform float mieCoefficient;
        uniform vec3 up;

        varying vec3 vWorldPosition;
        varying vec3 vSunDirection;
        varying float vSunfade;
        varying vec3 vBetaR;
        varying vec3 vBetaM;
        varying float vSunE;

        const float e = 2.71828182845904523536028747135266249775724709369995957;
        const float pi = 3.141592653589793238462643383279502884197169;
        const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
        const vec3 totalRayleigh = vec3( 5.80454299154567e-6, 1.35629114198456e-5, 3.02659024688248e-5 );
        const float v = 4.0;
        const vec3 K = vec3( 0.686, 0.678, 0.666 );
        const float MieConst = 1.8399918514433938E14;
        const float cutoffAngle = pi / 1.95;
        const float steepness = 1.5;
        const float EE = 1000.0;

        float sunIntensity( float zenithAngleCos ) {
            return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
        }

        vec3 totalMie( float T ) {
            float c = ( 0.2 * T ) * 10E-18;
            return 0.434 * c * pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K;
        }

        void main() {
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            gl_Position.z = gl_Position.w; // force sky to far plane
            vSunDirection = normalize( sunPosition );
            vSunE = sunIntensity( dot( vSunDirection, up ) );
            vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );
            float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );
            vBetaR = totalRayleigh * rayleighCoefficient;
            vBetaM = totalMie( turbidity ) * mieCoefficient;
        }
    `,
    fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vSunDirection;
        varying float vSunfade;
        varying vec3 vBetaR;
        varying vec3 vBetaM;
        varying float vSunE;
        uniform float mieDirectionalG;
        uniform vec3 up;
        const float pi = 3.141592653589793238462643383279502884197169;

        float rayleighPhase( float cosTheta ) {
            return ( 3.0 / ( 16.0 * pi ) ) * ( 1.0 + pow( cosTheta, 2.0 ) );
        }

        float hgPhase( float cosTheta, float g ) {
            float g2 = pow( g, 2.0 );
            float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
            return ( 1.0 / ( 4.0 * pi ) ) * ( ( 1.0 - g2 ) * inverse );
        }

        void main() {
            vec3 direction = normalize( vWorldPosition - cameraPosition );
            float cosTheta = dot( direction, vSunDirection );
            float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
            vec3 betaRTheta = vBetaR * rPhase;
            float mPhase = hgPhase( cosTheta, mieDirectionalG );
            vec3 betaMTheta = vBetaM * mPhase;
            vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - exp( - ( vBetaR + vBetaM ) ) ), vec3( 1.5 ) );
            Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - exp( - ( vBetaR + vBetaM ) ) ), vec3( 0.5 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );
            vec3 finalColor = Lin;
            // Tone mapping approximation
            finalColor = vec3( 1.0 ) - exp( - finalColor );
            gl_FragColor = vec4( finalColor, 1.0 );
        }
    `
};

// --- Scene Setup ---
const canvas = document.getElementById('bg-canvas');
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000000);
camera.position.set(0, 0, 5); // Moved back slightly for particle depth

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true // Enable alpha for fallback CSS
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;

// --- 1. Realistic Sky Setup ---
const sky = new Sky();
sky.scale.setScalar(450000);
scene.add(sky);

const sun = new THREE.Vector3();
const skyUniforms = sky.material.uniforms;

skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 3;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.7;

// --- 2. Particle "Warp" Effect (Restored) ---
const particlesGeometry = new THREE.BufferGeometry();
const isMobile = window.innerWidth < 768;
const particlesCount = isMobile ? 800 : 2000;
const posArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    // Spread particles in a wide area around the camera
    posArray[i] = (Math.random() - 0.5) * 40;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00f3ff, // Cyan accent
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending // Glow effect
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- 3. Sidereal Stars Setup ---
const starsGroup = new THREE.Group();
scene.add(starsGroup);

const starsGeometry = new THREE.BufferGeometry();
const starsCount = 5000;
const starsPosArray = new Float32Array(starsCount * 3);

// Distribute particles on a sphere
for (let i = 0; i < starsCount; i++) {
    const r = 400000; // Inside skybox but far
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
    size: 500,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0
});

const starsMesh = new THREE.Points(starsGeometry, starsMaterial);
starsGroup.add(starsMesh);


// --- Location & Logic ---
let userLat = 31.2304;
let userLon = 121.4737;

// Try to get location
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
        userLat = pos.coords.latitude;
        userLon = pos.coords.longitude;
        updateLocationDisplay(userLat, userLon);
        updateEnvironment();
    }, (err) => {
        console.warn('Geolocation denied, using default.');
        updateLocationDisplay(null, null); // Show default or error
        updateEnvironment();
    });
} else {
    updateEnvironment();
}

// Listen for language changes to update city name
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    // Re-fetch location text if we have coords
    if (userLat && userLon) {
        updateLocationDisplay(userLat, userLon, newLang);
    }
});

async function updateLocationDisplay(lat, lon, lang = 'en') {
    const locText = document.getElementById('location-text');
    const i18n = window.i18n; // Access global instance

    if (!lat || !lon) {
        if (locText) locText.innerText = i18n ? i18n.get('locu_unknown') : 'Unknown Location';
        return;
    }

    if (locText) locText.innerText = (i18n ? i18n.get('locu_searching') : 'Searching...') + ` ${lat.toFixed(2)}, ${lon.toFixed(2)}`;

    try {
        // Map app lang codes to BigDataCloud supported langs where possible
        // BigDataCloud supports: en, zh, de, etc.
        const apiLang = lang === 'zh' ? 'zh' : (lang === 'de' ? 'de' : 'en');

        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=${apiLang}`);
        const data = await response.json();

        const city = data.city || data.locality || data.principalSubdivision || 'Earth';
        const country = data.countryName || '';

        // Construct display string
        if (locText) locText.innerText = `${city}, ${country}`;

    } catch (e) {
        console.warn('City fetch failed', e);
        if (locText) locText.innerText = `Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`;
    }
}

function updateEnvironment() {
    const now = new Date();

    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);

    const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
    const axisTilt = 23.44;
    const declination = axisTilt * Math.sin(2 * Math.PI * (day + 284) / 365);

    const solarTime = utcHours + (userLon / 15);
    const hourAngle = (solarTime - 12) * 15;

    const latRad = THREE.MathUtils.degToRad(userLat);
    const decRad = THREE.MathUtils.degToRad(declination);
    const haRad = THREE.MathUtils.degToRad(hourAngle);

    const sinElevation = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
    const elevation = THREE.MathUtils.radToDeg(Math.asin(sinElevation));

    const cosAzimuth = (Math.sin(decRad) - Math.sin(latRad) * sinElevation) / (Math.cos(latRad) * Math.cos(Math.asin(sinElevation)));
    const clampedCosAz = Math.max(-1, Math.min(1, cosAzimuth));
    let azimuth = THREE.MathUtils.radToDeg(Math.acos(clampedCosAz));
    if (Math.sin(haRad) > 0) azimuth = 360 - azimuth;

    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);

    sun.setFromSphericalCoords(1, phi, theta);
    sky.material.uniforms['sunPosition'].value.copy(sun);

    let starOpacity = 0;
    if (elevation < 5) {
        starOpacity = THREE.MathUtils.mapLinear(elevation, 5, -10, 0, 1);
        starOpacity = Math.min(Math.max(starOpacity, 0), 1);
    }
    // Blend realistic stars
    starsMaterial.opacity = starOpacity;

    // Also blend the "Warp Particles" based on day/night?
    // User wants "Amazing" effects. Let's keep Warp Particles visible ALWAYS but maybe brighter at night.
    particlesMaterial.opacity = Math.max(0.4, starOpacity);

    const gst = utcHours + 0.0657098244 * day + 6.6;
    const lst = (gst + userLon / 15) % 24;

    starsGroup.rotation.set(0, 0, 0);
    const siderealAngle = THREE.MathUtils.degToRad(lst * 15);
    starsMesh.rotation.y = -siderealAngle;
    starsGroup.rotation.x = THREE.MathUtils.degToRad(90 - userLat);

    renderer.render(scene, camera);
}


// --- Animation Loop ---
let lastTime = 0;
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

function animate(time) {
    requestAnimationFrame(animate);

    if (time - lastTime > 5000) {
        updateEnvironment();
        lastTime = time;
    }

    // --- Particle Animation (The "Warp") ---
    targetX = mouseX * 0.001;
    targetY = mouseY * 0.001;

    // Smooth rotation of particle cloud
    particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
    particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);
    particlesMesh.rotation.y += 0.002; // Constant spin

    // Gentle camera movement
    camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.05 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2);
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const isMobileResize = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobileResize ? 1.5 : 2));
});

// UI Logic
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

animate(0);
// Initial update
updateEnvironment();
