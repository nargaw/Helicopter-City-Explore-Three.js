import './style.css'
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import fragment from './shaders/fragment.glsl'
import vertex from './shaders/vertex.glsl'
import Stats from 'stats.js'
import * as CANNON from 'cannon-es'
import cannonDebugger from 'cannon-es-debugger'
const canvas = document.querySelector('.webgl')

class NewScene{
    constructor(){
        this._Init()
    }
    
    _Init(){
        this.scene = new THREE.Scene()
        this.clock = new THREE.Clock()
        this.oldElapsedTime = 0
        this.v = new THREE.Vector3()
        this.gltfLoader = new GLTFLoader()
        this.objectsToUpdate = []
        this.buildingMaterials = []
        this.hoverMap = {}
        this.hoverTouch = {}
        this.climbing = false
        this.banking = false
        this.pitching = false
        this.yawing = false
        this.logEvents = false
        this.tpCache = new Array()
        this.stableLift = 4.0
        this.thrust = new CANNON.Vec3(0, 5, 0)
        this.downForce = new CANNON.Vec3(1.5, -0.000625, 0)
        this.InitStats()
        this.InitPhysics()
        //this.InitPhysicsDebugger()
        this.InitFireFlies()
        this.InitEnv()
        this.HeliGLTF()
        this.BuildingsGLTF()
        this.InitHeliControls()
        this.InitCamera()
        this.InitLights()
        this.InitRenderer()
        //this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
        document.addEventListener('mouseover', this.onDocumentHover, false)
        document.addEventListener('mouseout', this.onDocumentHover, false)
        document.addEventListener('touchstart', this.onDocumentTouch, {passive: false} )
        document.addEventListener('touchend', this.onDocumentTouch, {passive: false}, false)
    }

    InitStats(){
        this.stats = new Stats()
        document.body.appendChild(this.stats.dom)
    }

    InitPhysics(){
        this.world = new CANNON.World()
        this.world.gravity.set(0, -9.82, 0)
        this.defaultMaterial = new CANNON.Material('default')
        this.defaultContactMaterial = new CANNON.ContactMaterial(
            this.defaultMaterial,
            this.defaultMaterial,
            {
                friction: 0,
                restitution: 0
            }
        )
        this.world.broadphase = new CANNON.SAPBroadphase(this.world)
        this.world.allowSleep = true
        this.world.defaultContactMaterial = this.defaultContactMaterial
        this.world.addContactMaterial(this.defaultContactMaterial)
    }

    InitPhysicsDebugger(){
        cannonDebugger(
            this.scene,
            this.world.bodies,
            {
                color: 0x00ffff,
                autoUpdate: true
            }
        )
    }

    InitEnv(){
        this.planeGeomtery = new THREE.PlaneGeometry(1000, 1000)
        this.planeMaterial = new THREE.MeshStandardMaterial({
            color: 0x191919,
            side: THREE.DoubleSide
        })
        this.plane = new THREE.Mesh(this.planeGeomtery, this.planeMaterial)
        this.plane2 = new THREE.Mesh(this.planeGeomtery, this.planeMaterial)
        this.plane3 = new THREE.Mesh(this.planeGeomtery, this.planeMaterial)
        this.plane4 = new THREE.Mesh(this.planeGeomtery, this.planeMaterial)
        this.plane5 = new THREE.Mesh(this.planeGeomtery, this.planeMaterial)
        this.plane.rotation.x = -Math.PI * 0.5
        this.plane2.position.z = -500
        this.plane3.position.z = 500
        this.plane4.rotation.y = -Math.PI * 0.5
        this.plane4.position.x = -500
        this.plane5.rotation.y = -Math.PI * 0.5
        this.plane5.position.x = 500
        this.scene.add(this.plane, this.plane2, this.plane3, this.plane4, this.plane5)

        this.fog = new THREE.FogExp2(0xffffff, 0.005)
        this.scene.fog = this.fog

        this.groundBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.groundBody)
        this.groundBody.addShape(new CANNON.Plane())
        this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)

        this.ceiling = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.ceiling)
        this.ceiling.addShape(new CANNON.Box(new CANNON.Vec3(500, 2, 500)))
        this.ceiling.addShape(new CANNON.Box(new CANNON.Vec3(500, 500, 2)), new CANNON.Vec3(0, 0, 250))
        this.ceiling.addShape(new CANNON.Box(new CANNON.Vec3(500, 500, 2)), new CANNON.Vec3(0, 0, -250))
        this.ceiling.addShape(new CANNON.Box(new CANNON.Vec3(2, 500, 500)), new CANNON.Vec3(225, 0, 0))
        this.ceiling.addShape(new CANNON.Box(new CANNON.Vec3(2, 500, 500)), new CANNON.Vec3(-175, 0, 0))
        //this.ceiling.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
        this.ceiling.position.set(0, 250, 0)
    }

    BuildingsGLTF(){
        
        this.buildingMaterial = new THREE.MeshStandardMaterial({color: 0x8e0413})
        this.buildingMaterial2 = new THREE.MeshStandardMaterial({color: 0x004733})
        this.buildingMaterial3 = new THREE.MeshStandardMaterial({color: 0xcb0b0a})
        this.buildingMaterial4 = new THREE.MeshStandardMaterial({color: 0x568d66})
        
        //console.log(this.buildingMaterials)
        //console.log(this.buildingMaterials[Math.floor(Math.random(this.buildingMaterials.length))])
        this.gltfLoader.load(
            'buildings4.glb', (gltf) => {
                //console.log(gltf)
                gltf.scene.traverse((child) => {
                    for(let i = 0; i <= 9; i++){
                        this.randMaterial = this.buildingMaterials[Math.floor(Math.random(this.buildingMaterials.length))]
                        if(child.name === `buildings00${i}`){
                        child.material = this.buildingMaterial
                        child.castShadow = true
                        }
                    }
                    for(let i = 10; i <= 40; i++){
                        this.randMaterial = this.buildingMaterials[Math.floor(Math.random(this.buildingMaterials.length))]
                        if(child.name === `buildings0${i}`){
                        child.material = this.buildingMaterial2
                        child.castShadow = true
                        }
                    }

                    for(let i = 41; i <= 80; i++){
                        this.randMaterial = this.buildingMaterials[Math.floor(Math.random(this.buildingMaterials.length))]
                        if(child.name === `buildings0${i}`){
                        child.material = this.buildingMaterial3
                        child.castShadow = true
                        }
                    }

                    for(let i = 81; i <= 99; i++){
                        this.randMaterial = this.buildingMaterials[Math.floor(Math.random(this.buildingMaterials.length))]
                        if(child.name === `buildings0${i}`){
                        child.material = this.buildingMaterial4
                        child.castShadow = true
                        }
                    }
                    for(let i = 100; i <= 129; i++){
                        this.randMaterial = this.buildingMaterials[Math.floor(Math.random(this.buildingMaterials.length))]
                        if(child.name === `buildings${i}`){
                        child.material = this.buildingMaterial2
                        child.castShadow = true
                        }
                    }
                    
                })
                this.scene.add(gltf.scene)
            }
        )
        this.buildingBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(15, 28, 28)), new CANNON.Vec3(263, 30, 28))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(15, 28, 8)), new CANNON.Vec3(263, 28, 70))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(15, 25, 12)), new CANNON.Vec3(290, 25, 78))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 10, 60)), new CANNON.Vec3(196, 10, 60))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 66, 20)), new CANNON.Vec3(210, 66, 45))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 90, 20)), new CANNON.Vec3(190, 90, 35))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(10, 85, 15)), new CANNON.Vec3(180, 85, 118))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 27, 10)), new CANNON.Vec3(180, 27, 93))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 18, 14)), new CANNON.Vec3(180, 18, 70))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(15, 35, 12)), new CANNON.Vec3(210, 35, 125))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 28, 10)), new CANNON.Vec3(178, 28, 144))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(15, 16, 22)), new CANNON.Vec3(210, 16, 160))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(15, 25, 25)), new CANNON.Vec3(180, 25, 185))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 67, 12)), new CANNON.Vec3(210, 67, 195))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(25, 67, 18)), new CANNON.Vec3(195, 67, 225))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 107, 18)), new CANNON.Vec3(195, 107, 225))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(20, 80, 15)), new CANNON.Vec3(115, 80, 220))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 72, 22)), new CANNON.Vec3(130, 72, 155))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 22, 22)), new CANNON.Vec3(130, 22, 180))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 12, 22)), new CANNON.Vec3(100, 12, 180))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 28, 22)), new CANNON.Vec3(100, 28, 150))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 37, 12)), new CANNON.Vec3(100, 37, 130))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(14, 20, 5)), new CANNON.Vec3(130, 20, 125))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(28, 11, 58)), new CANNON.Vec3(115, 11, 64))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(28, 15, 20)), new CANNON.Vec3(115, 15, 115))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 75, 16)), new CANNON.Vec3(100, 75, 90))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(18, 65, 12)), new CANNON.Vec3(35, 65, 40))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 50, 120)), new CANNON.Vec3(35, 50, 150))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 30, 120)), new CANNON.Vec3(-45, 30, 160))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 60, 100)), new CANNON.Vec3(-130, 60, 170))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 60, 100)), new CANNON.Vec3(-130, 60, -170))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 60, 120)), new CANNON.Vec3(-130, 60, -155))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 60, 120)), new CANNON.Vec3(-40, 60, -155))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 60, 120)), new CANNON.Vec3(40, 60, -155))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 60, 120)), new CANNON.Vec3(120, 60, -155))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 20, 100)), new CANNON.Vec3(200, 20, -135))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(21, 87, 22)), new CANNON.Vec3(35, 87, 210))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(21, 130, 22)), new CANNON.Vec3(-45, 130, 210))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(25, 102, 28)), new CANNON.Vec3(-45, 102, 78))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(28, 112, 15)), new CANNON.Vec3(-135, 112, 15))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 82, 6)), new CANNON.Vec3(-42, 82, 5))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 97, 6)), new CANNON.Vec3(-60, 97, 5))
        //
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(30, 112, 15)), new CANNON.Vec3(-135, 112, 135))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(25, 99, 22)), new CANNON.Vec3(-135, 99, 215))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(25, 88, 18)), new CANNON.Vec3(-130, 88, -55))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 84, 20)), new CANNON.Vec3(-125, 84, -250))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 91, 20)), new CANNON.Vec3(-140, 91, -235))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(28, 86, 20)), new CANNON.Vec3(-40, 86, -55))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 80, 16)), new CANNON.Vec3(-20, 80, -255))

        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(22, 110, 22)), new CANNON.Vec3(120, 110, -95))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(12, 88, 40)), new CANNON.Vec3(200, 88, -105))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(6, 80, 40)), new CANNON.Vec3(220, 80, -94))
        this.buildingBody.addShape(new CANNON.Box(new CANNON.Vec3(6, 80, 55)), new CANNON.Vec3(178, 80, -105))


        this.world.addBody(this.buildingBody)
    }

    HeliGLTF(){
       
       this.meshMaterial = new THREE.MeshStandardMaterial({color: 0xffff00})
        this.gltfLoader.load(
            'heli2.glb', (gltf) => {
                gltf.scene.traverse((child) => {
                    child.material = this.meshMaterial
                    if(child.name === 'MainRotor'){
                        this.rotorMesh = child
                        
                    }
                    if(child.name === 'heli'){
                        this.heliMesh = child
                        // this.heliMesh.rotation.y = -Math.PI * 0.5
                        this.heliMesh.add(this.chaseCam)
                    }
                })
                this.scene.add(gltf.scene)
                //console.log(gltf)
                this.helicopterBody = new CANNON.Body({
                    mass: 0.0125,
                    material: this.defaultMaterial
                })
                this.helicopterShape = new CANNON.Box(new CANNON.Vec3(3., 1.5, 2.0))
                this.helicopterBody.addShape(this.helicopterShape)
                if(this.heliMesh){
                    this.helicopterBody.position.copy(this.heliMesh.position)
                }
                this.helicopterBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, -1, 0), Math.PI * 0.5)
                this.helicopterBody.angularDamping = 0.9
                this.world.addBody(this.helicopterBody)

                this.helicopterBody.addShape(new CANNON.Box(new CANNON.Vec3(3.0, 0.5, 2.5)), new CANNON.Vec3(0, -1.6, 0))
                //this.helicopterBody.addShape(new CANNON.Sphere(0.5), new CANNON.Vec3(0.0, 0.25, 0.0))
                
                if(this.heliMesh){
                    //console.log(this.heliMesh)
                    this.objectsToUpdate.push({
                        mesh: this.heliMesh,
                        body: this.helicopterBody
                    })
                }

                this.rotorShape = new CANNON.Sphere(0.1)
                this.rotorBody = new CANNON.Body({
                    mass: 0.12,
                    material: this.defaultMaterial
                })
                this.rotorBody.addShape(this.rotorShape)
                this.rotorBody.position.x = this.rotorMesh.position.x
                this.rotorBody.position.y = this.rotorMesh.position.y
                this.rotorBody.position.z = this.rotorMesh.position.z

                this.rotorBody.linearDamping = 0.5
                this.world.addBody(this.rotorBody)

                this.rotorConstraint = new CANNON.PointToPointConstraint(
                    this.helicopterBody,
                    new CANNON.Vec3(0, 0.001, 0),
                    this.rotorBody,
                    new CANNON.Vec3(0, 0, 0)
                )

                this.rotorConstraint.collideConnected = false
                this.world.addConstraint(this.rotorConstraint)

                this.objectsToUpdate.push({
                    mesh: this.rotorMesh,
                    body: this.rotorBody
                }) 
            }
        ) 
    }

    InitHeliControls(){
        this.onDocumentKey = (e) => {
            this.keyMap[e.key] = 'keydown'
        }
        this.onDocumentHover = (e) => {
            e.preventDefault()
            this.hoverMap[e.target.id] = e.type === 'mouseover'
        }
        this.onDocumentTouch = (e) => {
            e.preventDefault()
            if (e.targetTouches.length == 2){
                for ( let i = 0; i < e.targetTouches.length; i++){
                    this.tpCache.push(e.targetTouches[i]);
                }
            }
            if(this.logEvents) log('touchStart', e, true)
            this.hoverTouch[e.target.id] = e.type === 'touchstart'
        }
    }

    InitFireFlies(){
        this.firefliesGeometry = new THREE.BufferGeometry()
        this.firefliesCount = 100000
        this.positionArray = new Float32Array(this.firefliesCount * 3)
        this.scaleArray = new Float32Array(this.firefliesCount)
        for(let i = 0; i < this.firefliesCount; i++){
            this.positionArray[i * 3 + 0] = (Math.random() - 0.5) * 500
            this.positionArray[i * 3 + 1] = (Math.random()) * 50
            this.positionArray[i * 3 + 2] = (Math.random() - 0.5) * 500

            this.scaleArray[i] = Math.random()
        }
        this.firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(this.positionArray, 3))
        this.firefliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(this.scaleArray, 1))

        this.firefliesMaterial = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0},
                u_pixelRatio: { value: Math.min(window.devicePixelRatio, 2)},
                u_size: { value: 500 }
            },
            vertexShader: vertex,
            fragmentShader: fragment,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })
        this.fireflies = new THREE.Points(this.firefliesGeometry, this.firefliesMaterial)
        this.scene.add(this.fireflies)
    }

    InitLights(){
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(this.ambientLight)
        this.pointLight = new THREE.PointLight(0xffffff, 2.0, 5000)
        this.pointLight.position.set(0, 500, 0)
        this.scene.add(this.pointLight)
    }

    InitRenderer(){
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.render(this.scene, this.camera)
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000000)
        this.camera.position.set(0, 700, 0)
        this.scene.add(this.camera)
        this.chaseCam = new THREE.Object3D()
        this.chaseCam.position.set(0, 0, 0)
        this.chaseCamPivot = new THREE.Object3D()
        this.chaseCamPivot.position.set(-75, 40, 0)
        this.chaseCam.add(this.chaseCamPivot)
        this.scene.add(this.chaseCam)
    }

    InitControls(){
        this.controls = new OrbitControls(this.camera, canvas)
        this.controls.enableDamping = true
        this.controls.enablePan = true
        this.controls.update()   
    }

    Resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
    }

    Update(){
        requestAnimationFrame(() => {
            this.elapsedTime = this.clock.getElapsedTime()
            this.deltaTime = this.elapsedTime - this.oldElapsedTime
            this.oldElapsedTime = this.elapsedTime
            this.delta = this.clock.getDelta()
            this.world.step(1/60, this.oldElapsedTime, 3)
            if(this.rotorMesh && this.heliMesh){

            for(this.object of this.objectsToUpdate){
                this.object.mesh.position.copy(this.object.body.position)
                this.object.mesh.quaternion.copy(this.object.body.quaternion)
            }

            this.rotorMesh.rotateY(this.elapsedTime * this.thrust.y * 50)
            this.rotorMesh.position.copy(this.rotorBody.position)
            
            this.climbing = false
            if (this.hoverTouch['5'] || this.hoverMap['5']){
                if(this.thrust.y < 7.5){
                    this.thrust.y += 1.25 * this.deltaTime
                    this.climbing = true
                }
                
            }
            if(this.hoverTouch['6'] || this.hoverMap['6']){
                if(this.thrust.y > 3){
                    this.thrust.y -= 12 * this.deltaTime
                    //this.thrust.y = 3
                    this.climbing = true
                }
            }

            this.yawing = false
            this.banking = false
            if (this.hoverTouch['1'] || this.hoverMap['1']){
                if(this.rotorBody.angularVelocity.y < 1.0){
                    this.rotorBody.angularVelocity.y += 0.1 * this.deltaTime 
                    this.yawing = true
                if(this.thrust.x >= 1.5){
                    this.thrust.x -= 0.25 * this.deltaTime
                    }
                    this.banking = true
                }
            }
            
            if (this.hoverTouch['2'] || this.hoverMap['2']){
                if(this.rotorBody.angularVelocity.y > -1.0){
                    this.rotorBody.angularVelocity.y -= 0.1 * this.deltaTime 
                    this.yawing = true
                }
                if(this.thrust.x <= -1.5){
                    this.thrust.x += 0.25 * this.deltaTime 
                }
                this.banking = true
            }

            this.pitching = false
            if(this.hoverTouch['4'] || this.hoverMap['4']){
                if(this.thrust.z >= 0.0){
                    this.thrust.z -= 15.0 * this.deltaTime
                    
                    this.pitching = true     
                }
            }
            if(this.hoverTouch['3'] || this.hoverMap['3']){
                if(this.thrust.z <= 2.0 && this.heliMesh.position.y > 5){
                    this.thrust.z += 0.25 * this.deltaTime 
                    this.pitching = true
                    this.helicopterBody.applyLocalForce(this.downForce, new CANNON.Vec3(5.0, 0, 0),(new CANNON.Vec3(8, 0, 0.0)))
                    this.thrust.y += 0.15 * this.deltaTime
                    // if(this.rotorBody.quaternion.x < 2.5){
                    //     this.rotorBody.quaternion.x += 0.1 * this.deltaTime
                    //     
                    //     //this.heliMesh.rotation.x += 0.1 * this.deltaTime
                        
                    // }     
                }
            }
            // if(this.pitching === true){
            //     this.heliMesh.rotation.z += Math.PI * 0.5 * this.deltaTime
            //     this.rotorMesh.rotation.z += Math.PI * 0.5 * this.deltaTime
            // }
            //console.log(this.rotorBody.quaternion)
            //console.log(this.heliMesh.rotation.x)
            if(!this.yawing){
                if(this.rotorBody.angularVelocity.y < 0){
                    this.rotorBody.angularVelocity.y += 0.125 * this.deltaTime
                }
                if(this.rotorBody.angularVelocity.y > 0){
                    this.rotorBody.angularVelocity.y -= 0.125 * this.deltaTime
                }
            }

            this.helicopterBody.angularVelocity.y = this.rotorBody.angularVelocity.y

            if(!this.pitching){
                if(this.thrust.z < 0){
                    this.thrust.z += 2.5 * this.deltaTime
                    
                }
                if(this.thrust.z > 0){
                    this.thrust.z -= 2.5 * this.deltaTime
                    
                }
            }

            if(!this.climbing){
                this.thrust.y = 4.0
            }

            // if(!this.pitching){
            //     this.rotorBody.quaternion.set(0, 0, 0, 0)
            //     // if(this.rotorBody.quaternion.x < 0){
                        
            //     //         // this.rotorBody.quaternion.y += 1.05
            //     //         // this.rotorBody.quaternion.z += 1.05
            //     //     }
            //     // if(this.rotorBody.quaternion.x > 0){
                        
            //     //         // this.rotorBody.quaternion.y -= 1.05
            //     //         // this.rotorBody.quaternion.z -= 1.05
            //     //     }
            // }

            if(!this.banking){
                if(this.thrust.x < 0){
                    this.thrust.x += 5.5 * this.deltaTime
                }
                if(this.thrust.x > 0){
                    this.thrust.x -= 5.5 * this.deltaTime
                }
            }

            this.rotorBody.applyLocalForce(this.thrust, new CANNON.Vec3())  
        }
            if(this.heliMesh){
                this.camera.lookAt(this.heliMesh.position)
            }
            this.chaseCamPivot.getWorldPosition(this.v)
            if(this.v.y < 1){
                this.v.y = 1
            }
            
            this.camera.position.lerpVectors(this.camera.position, this.v, 0.5)
            this.renderer.render(this.scene, this.camera)
            //this.controls.update()
            this.Update()
            this.stats.update()
        })  
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})
