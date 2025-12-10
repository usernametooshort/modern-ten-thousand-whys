import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class FireSimulation {
    constructor() {
        this.container = document.getElementById('container');
        this.params = {
            floorCount: 30,
            fireStartFloor: 10,
            fireSpeed: 5, // 1 (slow) to 10 (fast)
            rescueDelay: 20, // seconds
            ladderMaxFloor: 15, // Max floor external ladder can reach (~45m)
            materialType: 'concrete', // concrete, steel, wood
            showThermal: false
        };

        this.materials = {
            concrete: { spreadMod: 0.8, heatRate: 10 },
            steel: { spreadMod: 1.2, heatRate: 25 },
            wood: { spreadMod: 2.0, heatRate: 40 }
        };

        this.state = {
            isRunning: false,
            timeElapsed: 0,
            rescueArrived: false,
            survivors: 0,
            casualties: 0,
            floors: [] 
        };

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.buildingGroup = null;
        this.fireSystem = null;
        this.smokeSystem = null;
        this.clock = new THREE.Clock();

        this.init();
        this.setupUI();
        this.animate();
    }

    init() {
        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b0d12);
        this.scene.fog = new THREE.FogExp2(0x0b0d12, 0.002);

        // Camera
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(100, 50, 100);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 100, 50);
        this.scene.add(dirLight);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxPolarAngle = Math.PI / 2;

        // Ground
        const groundGeo = new THREE.PlaneGeometry(500, 500);
        const groundMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        // Building
        this.createBuilding();

        // Event Listeners
        window.addEventListener('resize', () => this.onResize());
    }

    createBuilding() {
        if (this.buildingGroup) {
            this.scene.remove(this.buildingGroup);
        }
        this.buildingGroup = new THREE.Group();
        this.scene.add(this.buildingGroup);

        // Add Ladder Height Line (Visual Aid)
        const ladderH = this.params.ladderMaxFloor * 3; 
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(10, 0, 10), new THREE.Vector3(10, ladderH, 10),
            new THREE.Vector3(10, ladderH, 10), new THREE.Vector3(15, ladderH, 10)
        ]);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
        const ladderLine = new THREE.LineSegments(lineGeo, lineMat);
        this.buildingGroup.add(ladderLine);
        
        // Label
        // (Simple text sprite could be added here, skipping for brevity)

        this.state.floors = [];
        const floorHeight = 3;
        const floorWidth = 15;
        const floorDepth = 15;

        const geometry = new THREE.BoxGeometry(floorWidth, floorHeight - 0.2, floorDepth);
        
        for (let i = 0; i < this.params.floorCount; i++) {
            const floorGroup = new THREE.Group();
            
            const windowMat = new THREE.MeshStandardMaterial({ 
                color: 0x88ccff, 
                transparent: true, 
                opacity: 0.3,
                roughness: 0.2,
                metalness: 0.8
            });
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            
            const mesh = new THREE.Mesh(geometry, [
                frameMat, frameMat, // right, left
                frameMat, frameMat, // top, bottom
                windowMat, windowMat // front, back
            ]);
            
            floorGroup.position.y = i * floorHeight + floorHeight / 2;
            floorGroup.add(mesh);
            
            this.state.floors.push({
                id: i + 1,
                mesh: mesh,
                group: floorGroup,
                status: 'safe', 
                people: 10,
                evacProgress: 0,
                fireIntensity: 0,
                temperature: 20, // Celsius
                windowMat: windowMat
            });

            this.buildingGroup.add(floorGroup);
        }

        const centerHeight = (this.params.floorCount * floorHeight) / 2;
        this.controls.target.set(0, centerHeight, 0);
        this.camera.position.set(60, centerHeight, 80);
        this.controls.update();

        this.updateRiskPrediction();
    }

    resetSimulation() {
        this.state.isRunning = false;
        this.state.timeElapsed = 0;
        this.state.rescueArrived = false;
        this.state.survivors = 0;
        this.state.casualties = 0;

        this.state.floors.forEach(floor => {
            floor.status = 'safe';
            floor.people = 10;
            floor.evacProgress = 0;
            floor.fireIntensity = 0;
            floor.temperature = 20;
            floor.windowMat.emissive.setHex(0x000000);
            // Opacity reset is handled by updateRiskPrediction / updateVisuals
        });

        if (this.fireSystem) {
            this.scene.remove(this.fireSystem);
            this.fireSystem = null;
        }
        if (this.smokeSystem) {
            this.scene.remove(this.smokeSystem);
            this.smokeSystem = null;
        }

        this.updateStats();
        document.getElementById('sim-status').innerText = "准备就绪 (Ready)";
        document.getElementById('sim-status').style.color = "#4dabff";
        
        this.updateRiskPrediction();
        document.getElementById('risk-analysis').style.opacity = '1';
    }

    startSimulation() {
        if (this.state.isRunning) return;
        
        document.getElementById('risk-analysis').style.opacity = '0.5';
        
        // Reset visual state based on Thermal Toggle
        this.updateVisuals();

        this.state.isRunning = true;
        this.state.timeElapsed = 0;
        document.getElementById('sim-status').innerText = "火灾蔓延中 (Fire Spreading)";
        document.getElementById('sim-status').style.color = "#ff4d4d";
        
        const startIdx = this.params.fireStartFloor - 1;
        this.igniteFloor(startIdx);
    }

    igniteFloor(index) {
        if (index < 0 || index >= this.state.floors.length) return;
        const floor = this.state.floors[index];
        if (floor.status === 'fire') return;

        floor.status = 'fire';
        floor.fireIntensity = 1.0;
        floor.temperature = 800; // Immediate heat source
        
        if (!this.params.showThermal) {
            floor.windowMat.color.setHex(0xff2200);
            floor.windowMat.opacity = 0.9;
            floor.windowMat.emissive.setHex(0xff0000);
            floor.windowMat.emissiveIntensity = 0.8;
        }

        this.initDualParticleSystems(floor.group.position.y);
    }

    updateRiskPrediction() {
        if (this.state.isRunning) return;

        const startFloorIdx = this.params.fireStartFloor - 1;
        const rescueTime = this.params.rescueDelay;
        const mat = this.materials[this.params.materialType];
        
        // Material affects speed
        // Base spread factor (seconds per floor)
        const baseSpreadTime = (11 - this.params.fireSpeed) * (1.0/mat.spreadMod); 

        let safeCount = 0;
        let riskCount = 0;
        let fatalCount = 0;
        let minRiskFloor = -1;
        let minFatalFloor = -1;

        this.state.floors.forEach((floor, idx) => {
            if (idx < startFloorIdx) {
                floor.risk = 'safe';
                safeCount++;
                return;
            }
            if (idx === startFloorIdx) {
                floor.risk = 'fatal';
                fatalCount++;
                if (minFatalFloor === -1) minFatalFloor = idx + 1;
                return;
            }

            const floorsAboveFire = idx - startFloorIdx;
            let timeToReach = 0;
            
            // Ladder Logic for Prediction
            // If floor > maxLadderFloor, rescue arrival barely helps (or doesn't help)
            const isReachable = floor.id <= this.params.ladderMaxFloor;
            
            const timeBeforeRescue = rescueTime;
            const floorsBurnedBeforeRescue = timeBeforeRescue / baseSpreadTime;
            
            if (floorsAboveFire <= floorsBurnedBeforeRescue) {
                timeToReach = floorsAboveFire * baseSpreadTime;
            } else {
                // Rescue arrives.
                const remainingFloors = floorsAboveFire - floorsBurnedBeforeRescue;
                // If reachable, spread slows down (x3 time). If not, spread continues fast (x1 time or maybe x1.5 slightly slower due to lower draft)
                const slowdownFactor = isReachable ? 3.0 : 1.2; 
                timeToReach = rescueTime + remainingFloors * (baseSpreadTime * slowdownFactor);
            }

            // Evacuation Time (affected by material? No, mostly movement)
            const evacTime = 5 + (floor.id * 1.0); 

            if (timeToReach > evacTime + 5) {
                floor.risk = 'safe';
                safeCount++;
            } else if (timeToReach > evacTime) {
                floor.risk = 'warning';
                riskCount++;
                if (minRiskFloor === -1) minRiskFloor = floor.id;
            } else {
                floor.risk = 'fatal';
                fatalCount++;
                if (minFatalFloor === -1 || floor.id < minFatalFloor) minFatalFloor = floor.id;
            }
        });

        // Apply Prediction Colors
        this.state.floors.forEach(floor => {
            if (this.params.showThermal) {
                // Show base thermal color (e.g. 20C) or predicted thermal state?
                // For preview, let's just show "Cold/Safe" Thermal view to indicate mode is active.
                floor.windowMat.color.setHSL(0.6, 1.0, 0.22); // Blue
                floor.windowMat.opacity = 0.8;
            } else {
                if (floor.risk === 'safe') floor.windowMat.color.setHex(0x4dff88);
                else if (floor.risk === 'warning') floor.windowMat.color.setHex(0xffcc00);
                else floor.windowMat.color.setHex(0xff4444);
                floor.windowMat.opacity = 0.6;
            }
        });

        this.updateStatsText(minRiskFloor, minFatalFloor, riskCount, fatalCount);
    }

    updateStatsText(minRiskFloor, minFatalFloor, riskCount, fatalCount) {
        document.getElementById('safe-floors').innerText = `安全 (Safe): 1-${minRiskFloor > 1 ? minRiskFloor-1 : (minFatalFloor > 1 ? minFatalFloor-1 : this.params.floorCount)}`;
        let riskText = "无 (None)";
        if (riskCount > 0) {
            let end = minFatalFloor > -1 ? minFatalFloor - 1 : this.params.floorCount;
            riskText = `${minRiskFloor}-${end}`;
        }
        document.getElementById('risk-floors').innerText = `高危 (Risk): ${riskText}`;
        let fatalText = "无 (None)";
        if (fatalCount > 0) fatalText = `${minFatalFloor}+`;
        document.getElementById('fatal-floors').innerText = `极危 (Fatal): ${fatalText}`;
    }

    updateVisuals() {
        if (this.state.isRunning) {
             this.state.floors.forEach(floor => {
                 if (this.params.showThermal) {
                     // Thermal Gradient
                     // <100C: Blue/Green, 100-500: Yellow, >500: Red
                     const t = floor.temperature;
                     floor.windowMat.opacity = 0.8;
                     floor.windowMat.emissiveIntensity = 0;
                     
                     if (t < 50) floor.windowMat.color.setHSL(0.6, 1.0, 0.2 + t/100); // Blue
                     else if (t < 300) floor.windowMat.color.setHSL(0.15, 1.0, 0.5); // Yellow
                     else floor.windowMat.color.setHSL(0.0, 1.0, 0.5 + (t-300)/700); // Red -> White
                 } else {
                     // Normal View
                     if (floor.status === 'safe') {
                        floor.windowMat.color.setHex(0x88ccff); 
                        floor.windowMat.opacity = 0.3;
                     } else if (floor.status === 'fire') {
                        floor.windowMat.color.setHex(0xff2200);
                        floor.windowMat.opacity = 0.9;
                     } else if (floor.status === 'smoke') {
                        floor.windowMat.color.setHex(0x555555);
                        floor.windowMat.opacity = 0.5;
                     }
                 }
             });
        } else {
            // Preview Mode logic handled in updateRiskPrediction
             this.updateRiskPrediction();
        }
    }

    generateSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(canvas);
    }

    initDualParticleSystems(startHeight) {
        if (this.fireSystem || this.smokeSystem) return;

        const texture = this.generateSprite();

        // Fire
        const fireCount = 800;
        const fireGeo = new THREE.BufferGeometry();
        const firePos = new Float32Array(fireCount * 3);
        const fireLife = new Float32Array(fireCount); 
        const fireVel = new Float32Array(fireCount);
        const fireSizes = new Float32Array(fireCount);

        for(let i=0; i<fireCount; i++) this.resetParticle(firePos, fireLife, fireVel, fireSizes, i, startHeight, 'fire');

        fireGeo.setAttribute('position', new THREE.BufferAttribute(firePos, 3));
        fireGeo.setAttribute('life', new THREE.BufferAttribute(fireLife, 1));
        fireGeo.setAttribute('velocity', new THREE.BufferAttribute(fireVel, 1));
        fireGeo.setAttribute('size', new THREE.BufferAttribute(fireSizes, 1));
        fireGeo.userData = { baseHeight: startHeight };

        const fireShaderMat = new THREE.ShaderMaterial({
            uniforms: { tex: { value: texture } },
            vertexShader: `
                attribute float life; attribute float size; varying float vLife;
                void main() {
                    vLife = life;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform sampler2D tex; varying float vLife;
                void main() {
                    vec4 texColor = texture2D(tex, gl_PointCoord);
                    vec3 color = (vLife > 0.7) ? vec3(1.,1.,.8) : ((vLife>0.4)?vec3(1.,.6,.1):vec3(1.,.2,0.));
                    gl_FragColor = vec4(color, texColor.a * vLife * 1.5); 
                }
            `,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.fireSystem = new THREE.Points(fireGeo, fireShaderMat);
        this.scene.add(this.fireSystem);

        // Smoke
        const smokeCount = 1200;
        const smokeGeo = new THREE.BufferGeometry();
        const smokePos = new Float32Array(smokeCount * 3);
        const smokeLife = new Float32Array(smokeCount);
        const smokeVel = new Float32Array(smokeCount);
        const smokeSizes = new Float32Array(smokeCount);

        for(let i=0; i<smokeCount; i++) this.resetParticle(smokePos, smokeLife, smokeVel, smokeSizes, i, startHeight, 'smoke');

        smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
        smokeGeo.setAttribute('life', new THREE.BufferAttribute(smokeLife, 1));
        smokeGeo.setAttribute('velocity', new THREE.BufferAttribute(smokeVel, 1));
        smokeGeo.setAttribute('baseSize', new THREE.BufferAttribute(smokeSizes, 1));
        smokeGeo.userData = { baseHeight: startHeight };

        const smokeShaderMat = new THREE.ShaderMaterial({
            uniforms: { tex: { value: texture } },
            vertexShader: `
                attribute float life; attribute float baseSize; varying float vLife;
                void main() {
                    vLife = life;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = baseSize * (1.0 + (1.0 - life) * 4.0) * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                uniform sampler2D tex; varying float vLife;
                void main() {
                    vec4 texColor = texture2D(tex, gl_PointCoord);
                    gl_FragColor = vec4(vec3(0.1), texColor.a * (vLife * 0.4));
                }
            `,
            transparent: true, blending: THREE.NormalBlending, depthWrite: false
        });
        this.smokeSystem = new THREE.Points(smokeGeo, smokeShaderMat);
        this.scene.add(this.smokeSystem);
    }

    resetParticle(posArr, lifeArr, velArr, sizeArr, i, startY, type) {
        // CONSTRAINED BOUNDS: Building is roughly 15x15, centered at 0,0.
        // X, Z range: [-7.5, 7.5]
        const range = 6.0; // Keep it slightly inside
        posArr[i*3] = (Math.random()-0.5) * range * 2; 
        posArr[i*3+2] = (Math.random()-0.5) * range * 2;
        
        posArr[i*3+1] = startY + Math.random() * 3.0; // Height
        lifeArr[i] = 1.0;
        
        if (type === 'fire') {
            velArr[i] = 10.0 + Math.random() * 15.0;
            sizeArr[i] = 15.0 + Math.random() * 15.0;
        } else {
            velArr[i] = 5.0 + Math.random() * 8.0;
            sizeArr[i] = 25.0 + Math.random() * 25.0;
        }
    }

    updateParticles(dt) {
        if (!this.fireSystem || !this.state.isRunning) return;

        // Fire Update
        const fPos = this.fireSystem.geometry.attributes.position.array;
        const fLife = this.fireSystem.geometry.attributes.life.array;
        const fVel = this.fireSystem.geometry.attributes.velocity.array;
        const fBaseY = this.fireSystem.geometry.userData.baseHeight;
        const burnFloors = this.state.floors.filter(f => f.status === 'fire');

        for(let i=0; i<fLife.length; i++) {
            fLife[i] -= dt * (1.0 + Math.random());
            if(fLife[i] <= 0) {
                if(burnFloors.length > 0) {
                    const f = burnFloors[Math.floor(Math.random() * burnFloors.length)];
                    this.resetParticle(fPos, fLife, fVel, this.fireSystem.geometry.attributes.size.array, i, f.group.position.y, 'fire');
                } else {
                    this.resetParticle(fPos, fLife, fVel, this.fireSystem.geometry.attributes.size.array, i, fBaseY, 'fire');
                }
            } else {
                fPos[i*3+1] += fVel[i] * dt;
                // Slight jitter but stay close
                fPos[i*3] += (Math.random()-0.5)*0.2;
                fPos[i*3+2] += (Math.random()-0.5)*0.2;
            }
        }
        this.fireSystem.geometry.attributes.position.needsUpdate = true;
        this.fireSystem.geometry.attributes.life.needsUpdate = true;

        // Smoke Update
        if (this.smokeSystem) {
            const sPos = this.smokeSystem.geometry.attributes.position.array;
            const sLife = this.smokeSystem.geometry.attributes.life.array;
            const sVel = this.smokeSystem.geometry.attributes.velocity.array;
            const sBaseY = this.smokeSystem.geometry.userData.baseHeight;
            const sFloors = this.state.floors.filter(f => f.status === 'fire' || f.status === 'smoke');

            for(let i=0; i<sLife.length; i++) {
                sLife[i] -= dt * 0.2;
                if(sLife[i] <= 0) {
                    if(sFloors.length > 0) {
                        const f = sFloors[Math.floor(Math.random() * sFloors.length)];
                        this.resetParticle(sPos, sLife, sVel, this.smokeSystem.geometry.attributes.baseSize.array, i, f.group.position.y, 'smoke');
                    } else {
                        this.resetParticle(sPos, sLife, sVel, this.smokeSystem.geometry.attributes.baseSize.array, i, sBaseY, 'smoke');
                    }
                } else {
                    sPos[i*3+1] += sVel[i] * dt;
                    // Wind effect increases with height relative to spawn
                    const hDelta = sPos[i*3+1] - sBaseY;
                    sPos[i*3] += Math.sin(this.state.timeElapsed + hDelta*0.05) * 0.1 * (1 + hDelta*0.02);
                    sPos[i*3+2] += Math.cos(this.state.timeElapsed * 0.8) * 0.1;
                }
            }
            this.smokeSystem.geometry.attributes.position.needsUpdate = true;
            this.smokeSystem.geometry.attributes.life.needsUpdate = true;
        }
    }

    update(dt) {
        if (!this.state.isRunning) return;
        this.state.timeElapsed += dt;

        this.updateParticles(dt);

        // Material Logic
        const mat = this.materials[this.params.materialType];

        // Rescue Logic
        if (!this.state.rescueArrived && this.state.timeElapsed > this.params.rescueDelay) {
            this.state.rescueArrived = true;
            document.getElementById('sim-status').innerText = "消防队抵达 (Rescue Arrived)";
            document.getElementById('sim-status').style.color = "#4dff88";
        }

        // Fire Spread
        // Base speed modulated by material
        let baseSpreadTime = (11 - this.params.fireSpeed) * (1.0/mat.spreadMod); 
        
        // Find highest fire
        let highestFireIdx = -1;
        for (let i = 0; i < this.state.floors.length; i++) {
            if (this.state.floors[i].status === 'fire') highestFireIdx = i;
        }

        // Propagate Heat & Fire
        if (highestFireIdx >= 0 && highestFireIdx < this.state.floors.length - 1) {
            const nextFloor = this.state.floors[highestFireIdx + 1];
            
            // Check Ladder Reachability
            const isReachable = nextFloor.id <= this.params.ladderMaxFloor;
            
            // Effective Spread Factor
            let currentSpreadTime = baseSpreadTime;
            if (this.state.rescueArrived && isReachable) {
                currentSpreadTime *= 3.0; // Slow down significantly if reachable
            } else if (this.state.rescueArrived && !isReachable) {
                currentSpreadTime *= 1.2; // Slight slowdown (indirect cooling)
            }

            const transferRate = dt / currentSpreadTime;
            nextFloor.fireIntensity += transferRate;
            
            // Heat up
            nextFloor.temperature += mat.heatRate * dt;

            if (nextFloor.fireIntensity >= 1.0) {
                this.igniteFloor(highestFireIdx + 1);
            } else if (nextFloor.fireIntensity > 0.3) {
                if (nextFloor.status !== 'smoke' && nextFloor.status !== 'fire') {
                    nextFloor.status = 'smoke';
                    nextFloor.temperature += 50; // Smoke heat
                }
            }
        }

        // General Temperature Update (Cooling/Heating)
        this.state.floors.forEach(f => {
            if (f.status === 'fire') {
                if (f.temperature < 1000) f.temperature += 50 * dt;
            } else if (f.status === 'smoke') {
                if (f.temperature < 300) f.temperature += 10 * dt;
            } else {
                if (f.temperature > 20) f.temperature -= 5 * dt; // Cool down
            }
        });

        // Evacuation
        this.state.floors.forEach((floor) => {
            if (floor.people <= 0) return;

            if (floor.status === 'fire') {
                this.state.casualties += floor.people;
                floor.people = 0;
            } else {
                const evacTimeTotal = 5 + (floor.id * 1.0);
                const evacRate = floor.people / evacTimeTotal * dt * 5; 
                const speedMod = floor.status === 'smoke' ? 0.3 : 1.0;
                const leaving = Math.min(floor.people, evacRate * speedMod);
                floor.people -= leaving;
                this.state.survivors += leaving;

                if (floor.status === 'safe' && !this.params.showThermal) {
                   const pulse = (Math.sin(this.state.timeElapsed * 5) + 1) * 0.5;
                   floor.windowMat.emissive.setHex(0x00ff00);
                   floor.windowMat.emissiveIntensity = pulse * 0.3;
                }
            }
        });

        // Visuals Update (for thermal or normal changes)
        // Always update to ensure toggle OFF works during run
        this.updateVisuals();

        const totalPeople = this.state.floors.reduce((sum, f) => sum + f.people, 0);
        if (totalPeople <= 0.5 && this.state.isRunning) {
            this.state.isRunning = false;
            document.getElementById('sim-status').innerText = "模拟结束 (Finished)";
        }

        this.updateStats();
    }

    updateStats() {
        document.getElementById('survivors-count').innerText = Math.floor(this.state.survivors);
        document.getElementById('casualties-count').innerText = Math.floor(this.state.casualties);
    }

    setupUI() {
        const floorSlider = document.getElementById('floor-count');
        const floorVal = document.getElementById('floor-count-val');
        floorSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            floorVal.innerText = val + "层";
            this.params.floorCount = val;
            document.getElementById('fire-floor').max = val - 1;
            this.createBuilding();
            this.resetSimulation();
        });

        const fireSlider = document.getElementById('fire-floor');
        const fireVal = document.getElementById('fire-floor-val');
        fireSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            fireVal.innerText = val + "层";
            this.params.fireStartFloor = val;
            this.resetSimulation();
        });

        const speedSlider = document.getElementById('fire-speed');
        const speedVal = document.getElementById('fire-speed-val');
        const speedLabels = ["极慢", "慢", "中等", "快", "极快"];
        speedSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            const labelIdx = Math.floor((val-1)/2.1); 
            speedVal.innerText = speedLabels[Math.min(labelIdx, 4)];
            this.params.fireSpeed = val;
            this.updateRiskPrediction();
        });

        const delaySlider = document.getElementById('rescue-delay');
        const delayVal = document.getElementById('rescue-delay-val');
        delaySlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            delayVal.innerText = val + "秒";
            this.params.rescueDelay = val;
            this.updateRiskPrediction();
        });

        // Material
        document.getElementById('material-type').addEventListener('change', (e) => {
            this.params.materialType = e.target.value;
            this.updateRiskPrediction();
        });

        // Thermal Toggle
        document.getElementById('toggle-thermal').addEventListener('change', (e) => {
            this.params.showThermal = e.target.checked;
            if (!this.state.isRunning) this.updateVisuals(); // Update preview colors
        });

        document.getElementById('btn-start').addEventListener('click', () => this.startSimulation());
        document.getElementById('btn-reset').addEventListener('click', () => this.resetSimulation());

        const fab = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        fab.addEventListener('click', () => {
            sidebar.classList.toggle('visible');
        });
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const dt = this.clock.getDelta();
        this.update(dt);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new FireSimulation();