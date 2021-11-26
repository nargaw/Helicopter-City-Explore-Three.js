import './style.css'
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from 'dat.gui'
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
        this.objectsToUpdate = []
        this.keyMap = {}
        this.climbing = false
        this.banking = false
        this.pitching = false
        this.yawing = false
        this.stableLift = 14.7
        this.thrust = new CANNON.Vec3(0, 5, 0)
        this.InitCamera()
        this.InitStats()
        this.InitPhysics()
        this.InitPhysicsDebugger()
        this.InitEnv()
        this.InitBuildings()
        this.Heli()
        this.InitHeliControls()
        
        this.InitLights()
        this.InitRenderer()
        //this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
        document.addEventListener('keydown', this.onDocumentKey, false)
        document.addEventListener('keyup', this.onDocumentKey, false)

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
                friction: 0.25,
                restitution: 0.25
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
            color: 0x144552,
            side: THREE.DoubleSide
        })
        this.plane = new THREE.Mesh(this.planeGeomtery, this.planeMaterial)
        this.plane.rotation.x = -Math.PI * 0.5
        this.scene.add(this.plane)

        this.groundBody = new CANNON.Body({
            mass: 0,
            material: this.defaultMaterial
        })
        this.world.addBody(this.groundBody)
        this.groundBody.addShape(new CANNON.Plane())
        this.groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)
    }

    InitBuildings(){
        this.buildingMaterial = new THREE.MeshNormalMaterial()
        for (let i = 0; i <= 200; i++){
            this.rand = 50 + Math.random() * 50;
            this.x = Math.round(Math.random()*20+10)
            this.z = Math.round(Math.random()*20+10)
            this.angle = Math.random() * Math.PI * 20
            this.radius = 100 + Math.random() * 500
            this.posX = Math.cos(this.angle) * this.radius
            this.posZ = Math.sin(this.angle) * this.radius
            this.building = new THREE.Mesh(new THREE.BoxGeometry(this.x, this.rand, this.z), this.buildingMaterial)
            this.scene.add(this.building)
            this.building.position.set(this.posX, this.rand/2, this.posZ)
        
            this.buildingShape = new CANNON.Box(new CANNON.Vec3(this.x/2, this.rand/2, this.z/2))
            this.buildingBody = new CANNON.Body({
                mass: 0,
                material: this.defaultMaterial
            })
            this.buildingBody.position.set(this.posX, this.rand/2, this.posZ)
            this.buildingBody.addShape(this.buildingShape)
            this.world.addBody(this.buildingBody)
        }
    }

    Heli(){
        this.heliGeometry = new THREE.SphereBufferGeometry(0.66)
        this.heliMesh = new THREE.Mesh(this.heliGeometry, new THREE.MeshNormalMaterial())
        this.heliMesh.position.y = 1
        this.scene.add(this.heliMesh)
        this.heliMesh.add(this.chaseCam)

        this.heliTailGeometry = new THREE.BoxGeometry(0.1, 0.1, 2)
        this.heliTailMesh = new THREE.Mesh(this.heliTailGeometry, new THREE.MeshNormalMaterial())
        this.heliTailMesh.position.z = 1
        this.heliMesh.add(this.heliTailMesh)

        this.landingGeometry = new THREE.BoxGeometry(0.1, 0.05, 1.5)
        this.leftLandingMesh = new THREE.Mesh(this.landingGeometry, new THREE.MeshNormalMaterial())
        this.rightLandingMesh = new THREE.Mesh(this.landingGeometry, new THREE.MeshNormalMaterial())
        this.leftLandingMesh.position.set(-0.5, -0.5, 0)
        this.rightLandingMesh.position.set(0.5, -0.5, 0)
        this.heliMesh.add(this.leftLandingMesh, this.rightLandingMesh)
        
        this.helicopterBody = new CANNON.Body({
            mass: 0.05,
            material: this.defaultMaterial
        })
        this.helicopterShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.5, 0.6))
        this.helicopterBody.addShape(this.helicopterShape)
        this.helicopterBody.position.copy(this.heliMesh.position)
        this.helicopterBody.angularDamping = 0.9
        this.world.addBody(this.helicopterBody)
        
        
        this.objectsToUpdate.push({
            mesh: this.heliMesh,
            body: this.helicopterBody
        })


        this.rotorGeometry = new THREE.BoxGeometry(0.1, 0.01, 5)
        this.rotorMesh = new THREE.Mesh(this.rotorGeometry, new THREE.MeshNormalMaterial())
        this.rotorMesh.position.set(0, 3, 0)
        this.scene.add(this.rotorMesh)
        
        this.rotorShape = new CANNON.Sphere(0.1)
        this.rotorBody = new CANNON.Body({
            mass: 0.1,
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
            new CANNON.Vec3(0, 1, 0),
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

    InitHeliControls(){
        this.onDocumentKey = (e) => {
            this.keyMap[e.key] = 'keydown'
        }
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)
        this.chaseCam = new THREE.Object3D()
        this.chaseCam.position.set(0, 0, 0)
        this.chaseCamPivot = new THREE.Object3D()
        this.chaseCamPivot.position.set(0, 2, 4)
        this.chaseCam.add(this.chaseCamPivot)
        this.scene.add(this.chaseCam)
    }

    InitLights(){
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        this.scene.add(this.ambientLight)
    }

    InitRenderer(){
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
        })
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        this.renderer.render(this.scene, this.camera)
    }

    InitControls(){
        
            this.controls = new OrbitControls(this.camera, canvas)
            this.controls.enableDamping = true
            //this.controls.update()
        
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

            for(this.object of this.objectsToUpdate){
                this.object.mesh.position.copy(this.object.body.position)
                this.object.mesh.quaternion.copy(this.object.body.quaternion)
            }

            this.rotorMesh.position.set(
                this.rotorBody.position.x,
                this.rotorBody.position.y,
                this.rotorBody.position.z
            )
            this.rotorMesh.rotateY(this.elapsedTime * this.thrust.y * 40)
            this.rotorMesh.position.copy(this.rotorBody.position)

            this.climbing = false
            if (this.keyMap['e']){
                if(this.thrust.y < 40){
                    this.thrust.y += 3.5 * this.deltaTime
                    this.climbing = true
                }
            }
            if(this.keyMap['q']){
                if(this.thrust.y > 3){
                    this.thrust.y -= 2.5 * this.deltaTime
                    this.climbing = true
                }
            }

            // if(!this.elevate && this.heliMesh.position.y > 5){
            //     this.force.y = this.stableLift
            // }

            this.yawing = false
            this.banking = false
            if (this.keyMap['a']){
                if(this.rotorBody.angularVelocity.y < 2.0){
                    this.rotorBody.angularVelocity.y += 2.5 * this.deltaTime
                    this.yawing = true
                if(this.thrust.x >= -10.0){
                    this.thrust.x -= 5 * this.deltaTime
                    }
                    this.banking = true
                }
                
            }
            
            if (this.keyMap['d']){
                if(this.rotorBody.angularVelocity.y > -2.0){
                    this.rotorBody.angularVelocity.y -= 2.5 * this.deltaTime
                    this.yawing = true
                }
                if(this.thrust.x <= 10.0){
                    this.thrust.x += 5 * this.deltaTime
                }
                this.banking = true
            }

            this.pitching = false
            if(this.keyMap['w']){
                if(this.thrust.z >= -5.0){
                    this.thrust.z -= 2.5 * this.deltaTime
                    this.pitching = true     
                }
                
            }
            if(this.keyMap['s']){
                if(this.thrust.z <= 5.0){
                    this.thrust.z += 2.5 * this.deltaTime
                    this.pitching = true     
                }
                
            }

            if(!this.yawing){
                if(this.rotorBody.angularVelocity.y < 0){
                    this.rotorBody.angularVelocity.y += 1 * this.deltaTime
                }
                if(this.rotorBody.angularVelocity.y > 0){
                    this.rotorBody.angularVelocity.y -= 1 * this.deltaTime
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

            if(!this.banking){
                if(this.thrust.x < 0){
                    this.thrust.x += 2.5 * this.deltaTime
                }
                if(this.thrust.x > 0){
                    this.thrust.x -= 2.5 * this.deltaTime
                }
            }
            

            
            
            
            this.keyMap = {}


            this.rotorBody.applyLocalForce(this.thrust, new CANNON.Vec3())
            this.camera.lookAt(this.heliMesh.position)
            this.chaseCamPivot.getWorldPosition(this.v)
            if(this.v.y < 1){
                this.v.y = 1
            }
            this.camera.position.lerpVectors(this.camera.position, this.v, 1)
            //console.log(this.helicopterBody.position.y)
            //console.log(this.thrust.y)
            console.log(this.thrust.z)
            this.renderer.render(this.scene, this.camera)
            this.stats.update() 
            this.Update()
        })  
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})
