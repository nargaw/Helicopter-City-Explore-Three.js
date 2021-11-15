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
        this.v = new THREE.Vector3()
        this.objectsToUpdate = []
        this.keyMap = {}
        this.elevate = false
        this.force = new CANNON.Vec3(0, 0, 0)
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
                friction: 0.1,
                restitution: 0.2
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
        //this.group = new THREE.Group()
        this.heliMesh = new THREE.Mesh(new THREE.SphereBufferGeometry(1), new THREE.MeshBasicMaterial())
        
        //this.group.add(this.heliMesh)
        this.scene.add(this.heliMesh)
        this.heliMesh.add(this.chaseCam)
        this.heliMesh.position.set(0, 20, 0)
        //this.group.add(this.chaseCam)
        //this.group.position.set(0, 0, 100)
        
        this.helicopterBody = new CANNON.Body({
            mass: 0.5,
            material: this.defaultMaterial
        })
        this.helicopterShape = new CANNON.Sphere(5)
        this.helicopterTailShape = new CANNON.Box(new CANNON.Vec3(1, 1.5, 7))
        this.helicopterBody.addShape(this.helicopterShape)
        this.helicopterBody.addShape(new CANNON.Box(new CANNON.Vec3(3.5, 0.5, 3.5)))
        this.helicopterBody.addShape(new CANNON.Box(new CANNON.Vec3(3.5, 3.5, 0.5)))
        this.helicopterBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 4.0)), new CANNON.Vec3(-2.0, -7, 0))
        this.helicopterBody.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 4.0)), new CANNON.Vec3(2.0, -7, 0))
        this.helicopterBody.addShape(this.helicopterTailShape, new CANNON.Vec3(0, 0, 7) )
        this.world.addBody(this.helicopterBody)
        this.helicopterBody.position.set(0, 7, 0)
        
        this.rotorShape = new CANNON.Sphere(0.5)
        this.rotorBody = new CANNON.Body({
            mass: 1,
            material: this.defaultMaterial
        })
        this.rotorBody.addShape(this.rotorShape)
        this.rotorBody.addShape(new CANNON.Box(new CANNON.Vec3(10, 0.01, 0.25)))
        this.rotorBody.position.set(0, 10, 0)
        this.world.addBody(this.rotorBody)

        this.rotorConstraint = new CANNON.PointToPointConstraint(
            this.helicopterBody,
            new CANNON.Vec3(0, 6, 0),
            this.rotorBody,
            new CANNON.Vec3(0, 0, 0)
        )

        this.tailRotorShape = new CANNON.Sphere(0.25)
        this.tailRotorBody = new CANNON.Body({
            mass: 0.01,
            material: this.defaultMaterial
        })
        this.tailRotorBody.addShape(this.tailRotorShape)
        this.tailRotorBody.addShape(new CANNON.Box(new CANNON.Vec3(0.01, 2, 0.25)))
        this.tailRotorBody.position.set(0, 0, 15)
        this.world.addBody(this.tailRotorBody)

        this.tailRotorConstraint = new CANNON.PointToPointConstraint(
            this.tailRotorBody,
            new CANNON.Vec3(0, 0, 0),
            this.helicopterBody,
            new CANNON.Vec3(0, 0, 16.2)
        )

        this.rotorConstraint.collideConnected = false
        this.tailRotorConstraint.collideConnected = false
        this.world.addConstraint(this.rotorConstraint)
        this.world.addConstraint(this.tailRotorConstraint)
        this.helicopterBody.position.copy(this.heliMesh.position)
        this.objectsToUpdate.push({
            mesh: this.heliMesh,
            body: this.helicopterBody
        })
        
    }

    InitHeliControls(){
        this.onDocumentKey = (e) => {
            this.keyMap[e.key] = 'keydown'
            console.log(this.keyMap)
            
        }
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000)
        //this.camera.position.set(0, 10, 20)
        //this.scene.add(this.camera)
        this.chaseCam = new THREE.Object3D()
        this.chaseCam.position.set(0, 0, 0)
        this.chaseCamPivot = new THREE.Object3D()
        this.chaseCamPivot.position.set(0, 22, 44)
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
            this.world.step(1/60, this.oldElapsedTime, 3)

            

            for(this.object of this.objectsToUpdate){
                this.object.mesh.position.copy(this.object.body.position)
                this.object.mesh.quaternion.copy(this.object.body.quaternion)
            }

            //elevate
            this.elevate = false
            if (this.keyMap['e'] && 20 < this.force.y < 100 && 0 < this.helicopterBody.position.y < 200){
                this.force.y += 1
                this.elevate = true
                //console.log(this.force)
            }

            // if(!this.elevate){
            //     this.keyMap = {}
            // }

            // if(this.helicopterBody.position.y > 100 && this.force.y >= 100){
            //     this.force.y -= 0.1
            // }

            // if(!this.elevate && this.helicopterBody.position.y > 0 ){
            //     this.force.y = 9.82 + Math.sin(Math.random() * 0.001)
            // }

            this.rotorBody.angularVelocity.y = 40
            this.tailRotorBody.angularVelocity.x = 15
            this.rotorBody.applyForce(this.force, new CANNON.Vec3())

            this.camera.lookAt(this.heliMesh.position)
            this.chaseCamPivot.getWorldPosition(this.v)
            if(this.v.y < 1){
                this.v.y = 1
            }
            this.camera.position.lerpVectors(this.camera.position, this.v, 0.1)
            //console.log(this.helicopterBody.position.y)
            //console.log(this.force.y)
            this.renderer.render(this.scene, this.camera)
            //this.controls.update()
            this.stats.update() 
            this.Update()
        })  
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})
