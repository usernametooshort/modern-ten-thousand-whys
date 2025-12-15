import {
    BackSide,
    BoxGeometry,
    Mesh,
    ShaderMaterial,
    UniformsUtils,
    Vector3
} from 'three';

/**
 * Based on "A Practical Analytic Model for Daylight"
 * aka The Preetham Model, the de facto standard compliant with:
 * http://www.cs.utah.edu/~shirley/papers/sunsky/sunsky.pdf
 */

const Sky = function () {

    const shader = Sky.SkyShader;

    const material = new ShaderMaterial({
        name: 'SkyShader',
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: UniformsUtils.clone(shader.uniforms),
        side: BackSide,
        depthWrite: false
    });

    const geometry = new BoxGeometry(1, 1, 1);
    const mesh = new Mesh(geometry, material);

    // Hack/Extension to allow convenient access to uniforms
    mesh.isSky = true;

    mesh.scale.setScalar(450000);

    return mesh;

};

Sky.SkyShader = {

    uniforms: {
        'turbidity': { value: 10 },
        'rayleigh': { value: 2 },
        'mieCoefficient': { value: 0.005 },
        'mieDirectionalG': { value: 0.8 },
        'sunPosition': { value: new Vector3() },
        'up': { value: new Vector3(0, 1, 0) }
    },

    vertexShader: /* glsl */`
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

        // Constants for atmospheric scattering
        const float e = 2.71828182845904523536028747135266249775724709369995957;
        const float pi = 3.141592653589793238462643383279502884197169;

        // Wavelengths of primary colors
        const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );

        // K coefficient for the primary colors
        const vec3 totalRayleigh = vec3( 5.80454299154567e-6, 1.35629114198456e-5, 3.02659024688248e-5 );

        // Mie scattering constants
        const float v = 4.0;
        const vec3 K = vec3( 0.686, 0.678, 0.666 );
        const float MieConst = 1.8399918514433938E14;

        // Optical length at zenith for molecules
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

            // betaR calculation
            vBetaR = totalRayleigh * rayleighCoefficient;

            // betaM calculation
            vBetaM = totalMie( turbidity ) * mieCoefficient;

        }
    `,

    fragmentShader: /* glsl */`
        varying vec3 vWorldPosition;
        varying vec3 vSunDirection;
        varying float vSunfade;
        varying vec3 vBetaR;
        varying vec3 vBetaM;
        varying float vSunE;

        uniform float mieDirectionalG;
        uniform vec3 up;

        const float pi = 3.141592653589793238462643383279502884197169;
        const float n = 1.0003; 
        const float N = 2.545E25; 

        // optical length
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

            // Rayleigh scattering
            float cosTheta = dot( direction, vSunDirection );
            float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
            vec3 betaRTheta = vBetaR * rPhase;

            // Mie scattering
            float mPhase = hgPhase( cosTheta, mieDirectionalG );
            vec3 betaMTheta = vBetaM * mPhase;

            vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - exp( - ( vBetaR + vBetaM ) ) ), vec3( 1.5 ) );
            Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - exp( - ( vBetaR + vBetaM ) ) ), vec3( 0.5 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

            // Hack: Night Sky boost
            // If sun is low/gone, add a base deep blue/black
            // The standard Preetham model goes pitch black, but we might want a tiny bit of ambient
            
            vec3 finalColor = Lin;

            // Tone mapping approximation
            finalColor = vec3( 1.0 ) - exp( - finalColor );

            gl_FragColor = vec4( finalColor, 1.0 );
        }
    `

};

export { Sky };
