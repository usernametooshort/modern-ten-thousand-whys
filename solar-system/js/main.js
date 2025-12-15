import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Configuration
const CONFIG = {
    orbitSpeedMultiplier: 0.2, // Slower orbits for cinematic feel
    visualScale: 1.0,
    cameraFOV: 45,
    cameraNear: 0.1,
    cameraFar: 10000, // Increased to see galaxy skybox
    bgColor: 0x000000,
};

// Shaders
const EarthVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
}
`;

const EarthFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float time;

// Simplex 3D Noise 
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    // 3D Noise for Seamless Sphere Terrain
    vec3 seed = normalize(vNormal) * 3.0; // Scale of continents
    
    // Fractal Brownian Motion (approximated manually)
    float n = snoise(seed); 
    float n2 = snoise(seed * 2.0 + vec3(5.2)); 
    float n3 = snoise(seed * 8.0 + vec3(2.1));
    float n4 = snoise(seed * 16.0); // Micro details
    
    // Combine octaves
    float elevation = n * 0.5 + n2 * 0.25 + n3 * 0.12 + n4 * 0.05;
    
    // Colors
    vec3 oceanDeep = vec3(0.0, 0.02, 0.2);
    vec3 oceanShallow = vec3(0.0, 0.15, 0.4);
    vec3 sand = vec3(0.76, 0.70, 0.50);
    vec3 grass = vec3(0.05, 0.35, 0.05);
    vec3 forest = vec3(0.01, 0.15, 0.02);
    vec3 mountain = vec3(0.35, 0.30, 0.25);
    vec3 snow = vec3(1.0, 1.0, 1.0);
    
    vec3 finalColor = oceanDeep;
    float specular = 1.0; 
    
    // Ocean/Land thresholds
    float waterLevel = 0.05; 
    
    if (elevation < waterLevel) {
        float depth = (waterLevel - elevation) * 3.0;
        finalColor = mix(oceanShallow, oceanDeep, clamp(depth, 0.0, 1.0));
        specular = 1.0;
    } else {
        float landHeight = elevation - waterLevel;
        specular = 0.0; // Land is matte
        
        if (landHeight < 0.02) finalColor = sand;
        else if (landHeight < 0.2) finalColor = mix(grass, forest, smoothstep(0.02, 0.2, landHeight));
        else if (landHeight < 0.45) finalColor = mix(forest, mountain, smoothstep(0.2, 0.45, landHeight));
        else finalColor = mix(mountain, snow, smoothstep(0.45, 0.6, landHeight));
    }
    
    // Standard Lighting
    vec3 normal = normalize(vNormal);
    // Sun is at (0,0,0) in world, but we are orbiting. 
    // Simplified: Light always comes from (0,0,0) towards the planet.
    // Planet position in world space is needed to know where sun is relative to surface.
    // Hack: Assume Directional Light from center for now or pass uniform.
    // Since planet rotates, and sun is at 0,0,0, the "Sun Direction" in VIEW space is calculated in vertex.
    // But for this simple shader, let's just assume a static light for beauty, OR
    // Better: Use vNormal from modelView.
    // The sun is roughly at 'view' origin if we look at planet? No.
    // Let's make it look good: directional light from top-left.
    
    vec3 lightDir = normalize(vec3(1.0, 0.5, 1.0)); 
    float dotLN = max(dot(normal, lightDir), 0.0);
    
    // Specular
    vec3 viewDir = normalize(vViewPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    float specAngle = max(dot(normal, halfDir), 0.0);
    float specPower = 64.0;
    float specAmount = pow(specAngle, specPower) * specular;
    
    // Rim Lighting (Atmosphere)
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = pow(rim, 3.0);
    vec3 atmosphere = vec3(0.2, 0.5, 1.0) * rim * 0.8;
    
    vec3 color = finalColor * (dotLN + 0.1) + vec3(1.0)*specAmount + atmosphere;
    
    gl_FragColor = vec4(color, 1.0);
}
`;
const AtmosphereVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const AtmosphereFragmentShader = `
varying vec3 vNormal;
uniform vec3 color;
uniform float intensity;
uniform float power;

void main() {
    float alpha = pow(intensity + dot(vNormal, vec3(0.0, 0.0, 1.0)), power);
    gl_FragColor = vec4(color, alpha);
}
`;

const SunVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
uniform float time;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec3 pos = position;
    // Subtle pulsation
    // pos += normal * sin(time * 2.0) * 0.05;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const SunFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
uniform float time;

// Simplex 3D Noise 
float hash(float n) { return fract(sin(n) * 1e4); }
float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }

float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    float n1 = noise(vUv * 10.0 + vec2(time * 0.1, time * 0.2));
    float n2 = noise(vUv * 20.0 - vec2(time * 0.2, time * 0.1));
    float n3 = noise(vUv * 5.0 + vec2(0.0, time * 0.05));
    
    float total = n1 * 0.5 + n2 * 0.25 + n3 * 0.25;
    
    vec3 baseColor = vec3(1.0, 0.5, 0.0); // Orange
    vec3 hotColor = vec3(1.0, 0.9, 0.4);  // Yellow-White
    vec3 darkColor = vec3(0.8, 0.1, 0.0); // Dark Red
    
    vec3 finalColor = mix(darkColor, baseColor, total);
    finalColor = mix(finalColor, hotColor, pow(total, 3.0));
    
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 4.0);
    finalColor += vec3(1.0, 0.6, 0.1) * intensity;
    
    // Extra core brightness
    finalColor += vec3(0.2, 0.1, 0.0) * pow(total, 2.0);

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

const GalaxyVertexShader = `
varying vec3 vWorldPosition;
void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const GalaxyFragmentShader = `
varying vec3 vWorldPosition;
uniform float time;

// Simplex Noise 3D functionality
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
  // Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    vec3 dir = normalize(vWorldPosition);
    float n = snoise(dir * 2.0 + vec3(time * 0.05));
    float n2 = snoise(dir * 5.0 - vec3(time * 0.02));
    
    float stars = pow(max(0.0, snoise(dir * 150.0)), 20.0) * 2.0;
    
    vec3 colorA = vec3(0.0, 0.0, 0.05); // Deep Blue
    vec3 colorB = vec3(0.2, 0.0, 0.3); // Purple
    vec3 colorC = vec3(0.0, 0.1, 0.2); // Teal
    
    vec3 nebula = mix(colorA, colorB, n * 0.5 + 0.5);
    nebula = mix(nebula, colorC, n2 * 0.5 + 0.5);
    
    // Add subtle glow
    float glow = max(0.0, n * n2);
    nebula += vec3(0.1, 0.1, 0.2) * glow;
    
    gl_FragColor = vec4(nebula + vec3(stars), 1.0);
}
`;

// Planet Data with Translation Keys
const PLANET_DATA = [
    {
        nameKey: "solar_planet_mercury",
        type: "rocky",
        color: 0xA0958E,
        size: 1.6,
        distance: 32,
        speed: 2.8,
        rotationSpeed: 0.4,
        noiseScale: 15,
        bumpScale: 0.15,
        emissive: 0x221111,
        descKey: "solar_data_desc_mercury",
        facts: [
            { labelKey: "solar_fact_period", value: "88 d" },
            { labelKey: "solar_fact_surface", valueKey: "solar_val_rocky" },
            { labelKey: "solar_fact_atmos", value: "-" },
            { labelKey: "solar_fact_temp", value: "-180°C ~ 430°C" }
        ]
    },
    {
        nameKey: "solar_planet_venus",
        type: "atmosphere",
        color: 0xE6C076,
        size: 3.0,
        distance: 48,
        speed: 1.5,
        rotationSpeed: 0.2,
        atmosphereColor: 0xF5D0A2,
        atmosphereGlow: true,
        descKey: "solar_data_desc_venus",
        facts: [
            { labelKey: "solar_fact_period", value: "225 d" },
            { labelKey: "solar_fact_rotation", value: "-" },
            { labelKey: "solar_fact_greenhouse", value: "+++" },
            { labelKey: "solar_fact_temp", value: "~ 465°C" }
        ]
    },
    {
        nameKey: "solar_planet_earth",
        type: "earth",
        color: 0x2255AA,
        size: 3.2,
        distance: 68,
        speed: 1.0,
        rotationSpeed: 1.0,
        atmosphereColor: 0x6699FF,
        atmosphereGlow: true,
        bumpScale: 0.05,
        descKey: "solar_data_desc_earth",
        facts: [
            { labelKey: "solar_fact_period", value: "365.25 d" },
            { labelKey: "solar_fact_moons", value: "1" },
            { labelKey: "solar_fact_habitable", valueKey: "solar_val_yes" },
            { labelKey: "solar_fact_surface", valueKey: "solar_val_water" }
        ]
    },
    {
        nameKey: "solar_planet_mars",
        type: "rocky",
        color: 0xD1653E,
        size: 1.8,
        distance: 88,
        speed: 0.53,
        rotationSpeed: 0.9,
        noiseScale: 8,
        bumpScale: 0.2,
        atmosphereColor: 0xFF9966,
        atmosphereGlow: true,
        descKey: "solar_data_desc_mars",
        facts: [
            { labelKey: "solar_fact_period", value: "687 d" },
            { labelKey: "solar_fact_features", valueKey: "solar_val_fe2o3" },
            { labelKey: "solar_fact_polar", valueKey: "solar_val_ice" },
            { labelKey: "solar_fact_moons", value: "2" }
        ]
    },
    {
        nameKey: "solar_planet_jupiter",
        type: "gas",
        color: 0xD9B890,
        size: 9.0,
        distance: 130,
        speed: 0.08,
        rotationSpeed: 2.4,
        bandColor1: 0xC79E76,
        bandColor2: 0x7A6052,
        descKey: "solar_data_desc_jupiter",
        facts: [
            { labelKey: "solar_fact_period", value: "11.9 y" },
            { labelKey: "solar_fact_volume", value: "1300x Earth" },
            { labelKey: "solar_fact_comp", valueKey: "solar_val_h_he" },
            { labelKey: "solar_fact_spot", valueKey: "solar_val_yes" }
        ]
    },
    {
        nameKey: "solar_planet_saturn",
        type: "gas",
        color: 0xEBDDA9,
        size: 7.6,
        distance: 170,
        speed: 0.03,
        rotationSpeed: 2.2,
        bandColor1: 0xEBDDA9,
        bandColor2: 0xC9B589,
        rings: { inner: 1.3, outer: 2.2, color: 0xC9B589 },
        descKey: "solar_data_desc_saturn",
        facts: [
            { labelKey: "solar_fact_period", value: "29.5 y" },
            { labelKey: "solar_fact_rings", valueKey: "solar_val_yes" },
            { labelKey: "solar_fact_density", value: "0.687 g/cm³" },
            { labelKey: "solar_fact_moons", value: "80+" }
        ]
    },
    {
        nameKey: "solar_planet_uranus",
        type: "gas",
        color: 0x9FE6FF,
        size: 5.0,
        distance: 215,
        speed: 0.01,
        rotationSpeed: 1.4,
        bandColor1: 0x9FE6FF,
        bandColor2: 0x7AD3FF,
        noiseScale: 2,
        rings: { inner: 1.4, outer: 1.6, color: 0x8899AA, opacity: 0.4 },
        descKey: "solar_data_desc_uranus",
        facts: [
            { labelKey: "solar_fact_period", value: "84 y" },
            { labelKey: "solar_fact_tilt", value: "98°" },
            { labelKey: "solar_fact_appearance", valueKey: "solar_val_cyan" },
            { labelKey: "solar_fact_type", valueKey: "solar_val_ice_giant" }
        ]
    },
    {
        nameKey: "solar_planet_neptune",
        type: "gas",
        color: 0x3355FF,
        size: 4.8,
        distance: 255,
        speed: 0.006,
        rotationSpeed: 1.5,
        bandColor1: 0x3355FF,
        bandColor2: 0x2244CC,
        noiseScale: 20,
        descKey: "solar_data_desc_neptune",
        facts: [
            { labelKey: "solar_fact_period", value: "165 y" },
            { labelKey: "solar_fact_wind", value: "2100 km/h" },
            { labelKey: "solar_fact_darkspot", valueKey: "solar_val_yes" },
            { labelKey: "solar_fact_temp", valueKey: "solar_val_cold" }
        ]
    }
];

// --- Shaders for 100% Realism Overhaul ---

// Reusing EarthVertexShader logic for all planets as it provides standard view/normal data
const PlanetVertexShader = EarthVertexShader;

const GasPlanetFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform float time;
uniform vec3 baseColor;
uniform vec3 bandColor1;
uniform vec3 bandColor2;
uniform float scale;
uniform float distortion;

// Simplex Noise (same as Earth)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    // 3D Noise for gas bands
    vec3 seed = vNormal * scale; 
    
    // Animate turbulence
    float turbulence = snoise(seed + vec3(time * 0.1, 0.0, 0.0)) * distortion;
    
    // Banding mostly depends on Y (latitude), distorted by noise
    float band = (vNormal.y + turbulence * 0.5) * 5.0; // 5.0 = frequency of bands
    float noiseVal = snoise(seed * 2.0);
    
    vec3 color = mix(baseColor, bandColor1, sin(band) * 0.5 + 0.5);
    color = mix(color, bandColor2, noiseVal * 0.3); // Add some chaotic storms
    
    // Lighting
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(50.0, 20.0, 50.0)); // Fixed light for now
    
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Rim Light (Atmosphere)
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = pow(rim, 2.5);
    vec3 atmosphere = bandColor1 * rim * 0.4;
    
    gl_FragColor = vec4(color * (diff + 0.2) + atmosphere, 1.0);
}
`;

const RockyPlanetFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
uniform vec3 baseColor;
uniform float scale;
uniform float hasWater; // 0 or 1
uniform float hasIceCaps; // 0 or 1

// Simplex Noise (same as Earth)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    float n = snoise(vNormal * scale);
    float n2 = snoise(vNormal * scale * 4.0);
    
    // Crater-like details (Ridged noise)
    float crater = abs(n2); 
    
    vec3 color = baseColor * (0.8 + n * 0.2 + crater * 0.1);
    
    // Ice Caps for Mars-like planets
    if (hasIceCaps > 0.5) {
        float cap = abs(vNormal.y);
        if (cap > 0.85) {
            float noiseCap = snoise(vNormal * 10.0);
            if (cap + noiseCap * 0.05 > 0.88) {
                color = vec3(1.0); // White ice
            }
        }
    }

    // Lighting
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(50.0, 20.0, 50.0)); 
    
    float diff = max(dot(normal, lightDir), 0.0);
    
    gl_FragColor = vec4(color * (diff + 0.1), 1.0);
}
`;

// --- Minimal Simplex Noise Lib (Inlined for Procedural Textures) ---
class SimplexNoise {
    constructor() {
        this.grad3 = [[1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1], [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]];
        this.p = [];
        for (let i = 0; i < 256; i++) this.p[i] = Math.floor(Math.random() * 256);
        this.perm = [];
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    }
    dot(g, x, y) { return g[0] * x + g[1] * y; }
    noise(xin, yin) {
        let n0, n1, n2; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const s = (xin + yin) * F2; // Hairy factor for 2D
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
        const t = (i + j) * G2;
        const X0 = i - t; // Unskew the cell origin back to (x,y) space
        const Y0 = j - t;
        const x0 = xin - X0; // The x,y distances from the cell origin
        const y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) { i1 = 1; j1 = 0; } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else { i1 = 0; j1 = 1; }      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        const x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        const y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii + this.perm[jj]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
        // Calculate the contribution from the three corners
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) n0 = 0.0;
        else { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) n1 = 0.0;
        else { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) n2 = 0.0;
        else { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    }
}
const simplex = new SimplexNoise();

class SolarSystemApp {
    constructor() {
        this.container = document.querySelector('#scene-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();

        this.planets = [];
        this.orbits = [];
        this.asteroids = [];

        this.isPlaying = true;
        this.timeScale = 1.0;
        this.selectedPlanetData = null; // Track selection for translation updates

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Uniforms for shader animation
        this.uniforms = {
            time: { value: 0 }
        };

        this.textureCache = new Map();

        this.init();
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createControls();
        this.createLights();
        // this.createStarfield(); // Disable simple starfield, use galaxy + bg stars
        this.createBgStars(); // Distant background stars
        this.createSun();
        this.createSpiralGalaxy(); // 3D Skybox sphere
        this.createPlanets();
        this.createAsteroidBelt();
        this.setupEventListeners();

        // Intro Animation
        this.performIntro();

        this.renderer.setAnimationLoop(() => this.render());
    }

    createSpiralGalaxy() {
        // REALISTIC TELESCOPE VIEW: Mostly black with subtle Milky Way and nebulae
        const textureLoader = new THREE.TextureLoader();

        // 1. PURE BLACK BASE - The vast emptiness of space
        // (Already set in createScene as scene.background = black)

        // 2. MILKY WAY BAND - Subtle, positioned as a band across the sky
        const milkyWayTex = textureLoader.load('./textures/milky_way.png');
        milkyWayTex.colorSpace = THREE.SRGBColorSpace;
        const milkyWayGeo = new THREE.SphereGeometry(9500, 64, 64);
        const milkyWayMat = new THREE.MeshBasicMaterial({
            map: milkyWayTex,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.25, // Subtle, not overwhelming
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const milkyWay = new THREE.Mesh(milkyWayGeo, milkyWayMat);
        milkyWay.rotation.x = Math.PI * 0.5; // Position as band across equator
        milkyWay.renderOrder = -1002;
        this.scene.add(milkyWay);

        // 3. DISTANT NEBULA - Very faint, just hints of color in the black
        const nebulaTex = textureLoader.load('./textures/nebula_mid.png');
        nebulaTex.colorSpace = THREE.SRGBColorSpace;
        const nebulaGeo = new THREE.SphereGeometry(9000, 64, 64);
        const nebulaMat = new THREE.MeshBasicMaterial({
            map: nebulaTex,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.15, // Very subtle
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
        nebula.rotation.y = Math.PI * 0.6;
        nebula.rotation.z = Math.PI * 0.2;
        nebula.renderOrder = -1003;
        this.scene.add(nebula);

        // 4. PROCEDURAL STARFIELD - Sharp, crisp stars as 3D particles
        const starCount = 80000; // Even denser
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(starCount * 3);
        const starColors = new Float32Array(starCount * 3);

        const starColorPalette = [
            new THREE.Color(0xffffff),
            new THREE.Color(0xffffee),
            new THREE.Color(0xeeeeff),
            new THREE.Color(0xaaccff),
            new THREE.Color(0xffddaa),
            new THREE.Color(0xffaaaa),
        ];

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 2500 + Math.random() * 3500; // 2500-6000 varied distances

            starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            starPositions[i3 + 2] = radius * Math.cos(phi);

            const color = starColorPalette[Math.floor(Math.random() * starColorPalette.length)];
            starColors[i3] = color.r;
            starColors[i3 + 1] = color.g;
            starColors[i3 + 2] = color.b;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 1.0,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        stars.renderOrder = -999;
        this.scene.add(stars);

        this.galaxyMesh = nebula;
    }

    performIntro() {
        // Start camera far and tween in (simple lerp in render or set here)
        this.camera.position.set(0, 800, 1200);
        this.targetCameraPos = new THREE.Vector3(0, 120, 220);
        this.introProgress = 0;
        this.doingIntro = true;
    }

    createScene() {
        this.scene = new THREE.Scene();
        // Use black as base, the skybox sphere will provide the starfield
        this.scene.background = new THREE.Color(0x000000);
        // No fog - it obscures the skybox
    }

    createCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(CONFIG.cameraFOV, aspect, CONFIG.cameraNear, CONFIG.cameraFar);
        this.camera.position.set(0, 120, 220);
        this.camera.lookAt(0, 0, 0);
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);
    }

    createControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.2;
        this.controls.minDistance = 20;
        this.controls.maxDistance = 800;
        this.controls.maxPolarAngle = Math.PI * 0.6;
    }

    createLights() {
        const sunLight = new THREE.PointLight(0xffffff, 2.5, 1000, 1.5);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.bias = -0.0005;
        this.scene.add(sunLight);

        const ambientLight = new THREE.AmbientLight(0x404055, 0.5);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.3);
        this.scene.add(hemiLight);
    }

    createStarfield() {
        const count = 8000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorPalette = [
            new THREE.Color(0x9bb0ff), // O-type
            new THREE.Color(0xaabfff),
            new THREE.Color(0xcad7ff),
            new THREE.Color(0xf8f7ff),
            new THREE.Color(0xfff4ea),
            new THREE.Color(0xffd2a1),
            new THREE.Color(0xffcc6f)  // M-type
        ];

        for (let i = 0; i < count; i++) {
            const r = 1000 + Math.random() * 1000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.cos(phi);
            positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 1.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            map: this.createGlowTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });

        const starfield = new THREE.Points(geometry, material);
        this.scene.add(starfield);

        const dustCount = 3000;
        const dustGeo = new THREE.BufferGeometry();
        const dustPos = new Float32Array(dustCount * 3);
        for (let i = 0; i < dustCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 400 + Math.random() * 600;
            const spread = Math.random() * 100 * (Math.random() > 0.5 ? 1 : -1);
            dustPos[i * 3] = Math.cos(angle) * radius;
            dustPos[i * 3 + 1] = spread * Math.exp(-radius * 0.001);
            dustPos[i * 3 + 2] = Math.sin(angle) * radius;
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
        const dustMat = new THREE.PointsMaterial({
            color: 0x6633aa,
            size: 4,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            map: this.createGlowTexture()
        });
        const dust = new THREE.Points(dustGeo, dustMat);
        dust.rotation.x = Math.PI / 4;
        this.scene.add(dust);
    }

    createSun() {
        const geometry = new THREE.SphereGeometry(10, 64, 64);

        // NANO BANANA PRO: Use AI-generated photorealistic Sun texture
        const textureLoader = new THREE.TextureLoader();
        const sunMap = textureLoader.load('./textures/sun.png');
        sunMap.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshBasicMaterial({
            map: sunMap
        });
        const sun = new THREE.Mesh(geometry, material);
        this.scene.add(sun);

        const EarthVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vSunDirection;

uniform vec3 sunPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    
    // Calculate sun direction in view space (assuming sun is at 0,0,0 world for simplicity or passed in)
    // Actually, let's pass sun position relative to planet or just use a fixed light dir for the shader aesthetics
    // Better: Standard three.js lighting or approximations. 
    // Let's rely on a custom uniform for sun direction.
    
    gl_Position = projectionMatrix * mvPosition;
}
`;

        const EarthFragmentShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float time;
uniform sampler2D dayTexture; // We might not use these if fully procedural
uniform vec3 sunDirection;

// Simplex 3D Noise Helper
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y
  i = mod289(i);
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

void main() {
    // 1. Procedural Terrain Generation
    // Map UV to Sphere Coords for seamless noise (approximation)
    // Actually, we need 3D coords for seamless noise on a sphere.
    // Let's use vNormal as the 3D seed, it's perfect for spheres!
    vec3 seed = vNormal * 2.0; 
    
    float n = snoise(seed * 1.5 + vec3(0.0)); // Base continents
    float n2 = snoise(seed * 4.0 + vec3(1.2)); // Details
    float n3 = snoise(seed * 10.0); // Rocky details
    
    float elevation = n * 0.6 + n2 * 0.3 + n3 * 0.1;
    
    // 2. Biome Colors
    vec3 oceanDeep = vec3(0.0, 0.05, 0.2);
    vec3 oceanShallow = vec3(0.0, 0.2, 0.4);
    vec3 sand = vec3(0.76, 0.70, 0.50);
    vec3 grass = vec3(0.1, 0.4, 0.1);
    vec3 forest = vec3(0.05, 0.25, 0.05);
    vec3 mountain = vec3(0.4, 0.35, 0.3);
    vec3 snow = vec3(1.0, 1.0, 1.0);
    
    vec3 color = oceanDeep;
    float specular = 0.5; // High specular for ocean
    
    if (elevation > 0.0) { // Water level
        color = mix(oceanShallow, val > 0.05 ? sand : oceanShallow, smoothstep(0.0, 0.05, elevation));
        specular = 0.2; // Less specular in shallow
    }
    if (elevation > 0.05) { // Land start
        color = mix(sand, grass, smoothstep(0.05, 0.1, elevation));
        specular = 0.0; // No specular on land
    }
    if (elevation > 0.2) {
        color = mix(grass, forest, smoothstep(0.2, 0.4, elevation));
    }
    if (elevation > 0.45) {
        color = mix(forest, mountain, smoothstep(0.45, 0.6, elevation));
    }
    if (elevation > 0.7) {
        color = mix(mountain, snow, smoothstep(0.7, 0.8, elevation));
    }
    
    // 3. Lighting (Simple directional)
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(50.0, 20.0, 50.0)); // Fixed sun dir for now, should be uniform
    
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    
    // Day/Night and Atmosphere
    vec3 finalColor = color * (diff + 0.1); // Ambient
    finalColor += vec3(1.0) * spec * specular; // Sun reflection on water
    
    // Rim Light (Atmosphere)
    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = pow(rim, 4.0);
    finalColor += vec3(0.4, 0.6, 1.0) * rim * 0.5;

    gl_FragColor = vec4(finalColor, 1.0);
}
`;

        // Multiple Glow Layers for Blinding Realism
        // Inner intense white/yellow
        const glowMat = new THREE.SpriteMaterial({
            map: this.createGlowTexture({ size: 512, inner: 'rgba(255,255,220,1)', outer: 'rgba(255,200,0,0)' }),
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Sprite(glowMat);
        glow.scale.set(30, 30, 1);
        sun.add(glow);

        // Outer Coronal Haze
        const coronaMat = new THREE.SpriteMaterial({
            map: this.createGlowTexture({ size: 512, inner: 'rgba(255,100,0,0.4)', outer: 'rgba(100,0,0,0)' }),
            color: 0xff5500,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        const corona = new THREE.Sprite(coronaMat);
        corona.scale.set(60, 60, 1);
        sun.add(corona);

        // God-ray lines (static billboard lines for flare effect)
        // ... (Skipping for now to keep performance high)

        const coreMat = new THREE.SpriteMaterial({
            map: this.createGlowTexture({ size: 128 }),
            color: 0xffffcc,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Sprite(coreMat);
        core.scale.set(22, 22, 1);
        sun.add(core);
    }

    createPlanets() {
        PLANET_DATA.forEach(data => {
            const group = new THREE.Group();
            this.scene.add(group);

            const orbitGeo = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 128);
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.08,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = -Math.PI / 2;
            this.scene.add(orbit);
            this.orbits.push(orbit);

            const planetGeo = new THREE.SphereGeometry(data.size, 64, 64);
            let material;



            // --- NANO BANANA PRO: AI-Generated Texture Materials ---
            const textureLoader = new THREE.TextureLoader();

            // Map nameKey to texture filename
            const textureMap = {
                'solar_planet_mercury': 'mercury.png',
                'solar_planet_venus': 'venus.png',
                'solar_planet_earth': 'earth_day.png',
                'solar_planet_mars': 'mars.png',
                'solar_planet_jupiter': 'jupiter.png',
                'solar_planet_saturn': 'saturn.png',
                'solar_planet_uranus': 'uranus.png',
                'solar_planet_neptune': 'neptune.png'
            };

            const texturePath = textureMap[data.nameKey];
            if (texturePath) {
                const planetMap = textureLoader.load('./textures/' + texturePath);
                planetMap.colorSpace = THREE.SRGBColorSpace;

                material = new THREE.MeshStandardMaterial({
                    map: planetMap,
                    roughness: data.type === 'gas' ? 0.9 : 0.7,
                    metalness: 0.0
                });
            } else {
                // Fallback for any unknown planets
                material = new THREE.MeshStandardMaterial({
                    color: data.color,
                    roughness: 0.7,
                    metalness: 0.1
                });
            }

            const planet = new THREE.Mesh(planetGeo, material);
            planet.position.x = data.distance;
            planet.castShadow = true;
            planet.receiveShadow = true;
            group.add(planet);

            // Add Atmosphere for Earth (Enhanced)
            if (data.type === 'earth') {
                const atmoGeo = new THREE.SphereGeometry(data.size * 1.25, 64, 64);
                const atmoMat = new THREE.ShaderMaterial({
                    uniforms: {
                        color: { value: new THREE.Color(0x3366ff) },
                        intensity: { value: 0.5 },
                        power: { value: 4.0 }
                    },
                    vertexShader: AtmosphereVertexShader,
                    fragmentShader: AtmosphereFragmentShader,
                    transparent: true,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const atmo = new THREE.Mesh(atmoGeo, atmoMat);
                planet.add(atmo);
            } else if (data.atmosphereGlow) { // Existing atmosphere logic for other planets
                const atmoGeo = new THREE.SphereGeometry(data.size * 1.15, 64, 64);
                const atmoMat = new THREE.ShaderMaterial({
                    uniforms: {
                        color: { value: new THREE.Color(data.atmosphereColor) },
                        intensity: { value: 0.5 },
                        power: { value: 4.0 }
                    },
                    vertexShader: AtmosphereVertexShader,
                    fragmentShader: AtmosphereFragmentShader,
                    transparent: true,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const atmo = new THREE.Mesh(atmoGeo, atmoMat);
                planet.add(atmo);
            }



            // Cloud Layer for Earth (AI-generated texture)
            if (data.type === 'earth') {
                const cloudGeo = new THREE.SphereGeometry(data.size * 1.02, 64, 64);
                const cloudLoader = new THREE.TextureLoader();
                const cloudTex = cloudLoader.load('./textures/earth_clouds.png');
                cloudTex.colorSpace = THREE.SRGBColorSpace;

                const cloudMat = new THREE.MeshStandardMaterial({
                    map: cloudTex,
                    transparent: true,
                    opacity: 0.6,
                    alphaMap: cloudTex, // Use same texture for alpha
                    side: THREE.DoubleSide,
                    depthWrite: false
                });
                const clouds = new THREE.Mesh(cloudGeo, cloudMat);
                clouds.isClouds = true;
                planet.add(clouds);
            }

            if (data.rings) {
                const ringGeo = new THREE.RingGeometry(data.size * data.rings.inner, data.size * data.rings.outer, 128);

                // Use AI-generated ring texture for Saturn
                const ringLoader = new THREE.TextureLoader();
                const ringTex = ringLoader.load('./textures/saturn_rings.png');
                ringTex.colorSpace = THREE.SRGBColorSpace;

                // Fix UV mapping for ring geometry
                const pos = ringGeo.attributes.position;
                const v3 = new THREE.Vector3();
                for (let i = 0; i < pos.count; i++) {
                    v3.fromBufferAttribute(pos, i);
                    ringGeo.attributes.uv.setXY(i, v3.length() < (data.size * (data.rings.inner + data.rings.outer) / 2) ? 0 : 1, 1);
                }

                const ringMat = new THREE.MeshStandardMaterial({
                    map: ringTex,
                    color: 0xffffff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: data.rings.opacity || 0.9
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                ring.rotation.y = -Math.PI / 8;
                ring.receiveShadow = true;
                planet.add(ring);
            }

            this.planets.push({
                mesh: planet,
                distance: data.distance,
                angle: Math.random() * Math.PI * 2,
                speed: data.speed,
                rotationSpeed: data.rotationSpeed,
                data: data
            });
        });
    }

    createAsteroidBelt() {
        const count = 2000;
        const geometry = new THREE.IcosahedronGeometry(0.3, 0);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.9,
            metalness: 0.1
        });
        const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = THREE.MathUtils.randFloat(85, 95);
            const y = THREE.MathUtils.randFloatSpread(4);

            dummy.position.set(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r
            );
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
            const s = Math.random() * 0.5 + 0.5;
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }

        this.scene.add(instancedMesh);
        this.asteroidBelt = instancedMesh;
    }



    generateRingTexture(hexColor) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const baseColor = new THREE.Color(hexColor);

        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, 64, 512);

        for (let y = 0; y < 512; y++) {
            const intensity = 0.5 + Math.random() * 0.5;
            const gap = Math.random() > 0.95;
            if (!gap) {
                const col = baseColor.clone().multiplyScalar(0.8 + Math.random() * 0.4);
                ctx.fillStyle = `rgba(${col.r * 255},${col.g * 255},${col.b * 255},${intensity})`;
                ctx.fillRect(0, y, 64, 1);
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    createGlowTexture(options = {}) {
        const size = options.size || 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, options.inner || 'rgba(255,255,255,1)');
        gradient.addColorStop(1, options.outer || 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    updatePlanets(delta) {
        if (!this.isPlaying) return;

        this.planets.forEach(p => {
            p.angle += p.speed * delta * CONFIG.orbitSpeedMultiplier * this.timeScale;
            p.mesh.position.x = Math.cos(p.angle) * p.distance;
            p.mesh.position.z = Math.sin(p.angle) * p.distance;
            p.mesh.rotation.y += p.rotationSpeed * delta * 0.5;

            // Rotate clouds
            p.mesh.children.forEach(child => {
                if (child.isClouds) {
                    child.rotation.y += delta * 0.05;
                }
            });
        });

        if (this.asteroidBelt) {
            this.asteroidBelt.rotation.y += delta * 0.02 * CONFIG.orbitSpeedMultiplier * this.timeScale;
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        });

        window.addEventListener('click', (e) => {
            if (e.target.closest('.controls') || e.target.closest('.info-panel')) return;

            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.raycaster.setFromCamera(this.mouse, this.camera);

            const meshes = this.planets.map(p => p.mesh);
            const intersects = this.raycaster.intersectObjects(meshes, false);

            if (intersects.length > 0) {
                const hit = intersects[0].object;
                const pData = this.planets.find(p => p.mesh === hit);
                if (pData) this.showInfo(pData.data);
            }
        });

        // Language Change Event
        window.addEventListener('languageChanged', () => {
            this.updateUI();
            if (this.selectedPlanetData) {
                this.showInfo(this.selectedPlanetData);
            }
        });

        document.getElementById('btn-pause').addEventListener('click', (e) => {
            this.isPlaying = !this.isPlaying;
            this.updateUI();
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            this.controls.reset();
            this.camera.position.set(0, 120, 220);
        });

        document.getElementById('slider-speed').addEventListener('input', (e) => {
            this.timeScale = parseFloat(e.target.value);
        });

        document.getElementById('toggle-orbits').addEventListener('change', (e) => {
            this.orbits.forEach(o => o.visible = e.target.checked);
        });

        const mobileInfoToggle = document.getElementById('mobile-info-toggle');
        if (mobileInfoToggle) {
            mobileInfoToggle.addEventListener('click', () => {
                const panel = document.querySelector('.info-panel');
                if (panel) panel.classList.toggle('open');
            });
        }
    }

    updateUI() {
        const pauseBtn = document.getElementById('btn-pause');
        if (pauseBtn) {
            const key = this.isPlaying ? 'btn_pause' : 'btn_resume';
            pauseBtn.textContent = window.i18n.get(key);
        }
    }

    showInfo(data) {
        this.selectedPlanetData = data; // Store for re-translation
        const panel = document.getElementById('planet-info');
        const desc = document.querySelector('.description');
        const name = document.getElementById('info-name');
        const detail = document.getElementById('info-details');
        const facts = document.getElementById('info-facts');

        panel.classList.remove('hidden');
        if (desc) desc.style.display = 'none';

        name.textContent = window.i18n.get(data.nameKey);
        detail.textContent = window.i18n.get(data.descKey);

        facts.innerHTML = '';
        data.facts.forEach(f => {
            const div = document.createElement('div');
            div.className = 'fact-card';
            const label = window.i18n.get(f.labelKey);
            // Value might be a key or a value
            // If value starts with 'solar_', it's a key? Or check if translation exists?
            // Current data has some hardcoded values like "88 d" and some keys like "solar_planet_mercury".
            // Let's check if value exists in i18n, else use value.
            // A simple heuristic: if value looks like a key (contains underscore), try translating.
            // But "88 d" doesn't.
            let value = f.value;
            // Hardcoded values with units (d, y, etc) should ideally be formatted, but for now keeping as is unless it's a clear key.
            // Actually, keys were used for some values in my PLANET_DATA update above.
            // e.g., valueKey: "solar_planet_mercury"

            if (f.valueKey) {
                value = window.i18n.get(f.valueKey);
            }

            div.innerHTML = `<div class="fact-label">${label}</div><div class="fact-value">${value}</div>`;
            facts.appendChild(div);
        });
    }

    createBgStars() {
        // Thousands of tiny stars far away
        const count = 5000;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const size = new Float32Array(count);
        for (let i = 0; i < count * 3; i += 3) {
            const r = 2000 + Math.random() * 2000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
            pos[i] = r * Math.sin(phi) * Math.cos(theta);
            pos[i + 1] = r * Math.cos(phi);
            pos[i + 2] = r * Math.sin(phi) * Math.sin(theta);
            size[i / 3] = Math.random() * 2.0;
        }
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
        const mat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.8,
            map: this.createGlowTexture({ size: 32 }),
            depthWrite: false
        });
        this.scene.add(new THREE.Points(geo, mat));
    }

    render() {
        const delta = this.clock.getDelta();
        this.uniforms.time.value += delta;

        // Galaxy Rotation
        if (this.galaxyMesh) {
            this.galaxyMesh.rotation.y += delta * 0.02;
        }

        // Intro Animation
        if (this.doingIntro) {
            this.introProgress += delta * 0.5; // 2 seconds intro
            if (this.introProgress >= 1.0) {
                this.introProgress = 1.0;
                this.doingIntro = false;
            }
            // Ease out cubic
            const t = 1 - Math.pow(1 - this.introProgress, 3);
            this.camera.position.lerpVectors(new THREE.Vector3(0, 800, 1200), this.targetCameraPos, t);
            this.camera.lookAt(0, 0, 0);
        } else {
            this.controls.update();
        }

        this.updatePlanets(delta);

        this.renderer.render(this.scene, this.camera);
    }
}

new SolarSystemApp();
