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
        this.objectsToUpdate = []
        this.InitStats()
        this.InitPhysics()
        this.InitPhysicsDebugger()
        this.InitCamera()
        this.InitEnv()
        this.InitBuildings()
        this.Heli()
        this.InitLights()
        this.InitRenderer()
        this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
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
                color: 0xff00ff,
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
        this.helicopterBody = new CANNON.Body({
            mass: 1,
            material: this.defaultMaterial
        })
        this.helicopterShape = new CANNON.Sphere(5)
        this.helicopterBody.addShape(this.helicopterShape)
        this.helicopterBody.addShape(new CANNON.Box(new CANNON.Vec3(3.5, 0.5, 3.5)))
        this.helicopterBody.addShape(new CANNON.Box(new CANNON.Vec3(3.5, 3.5, 0.5)))
        this.world.addBody(this.helicopterBody)
        this.helicopterBody.position.set(0, 15, 0)
        

    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000)
        this.camera.position.set(0, 5, 15)
        this.scene.add(this.camera)
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
            this.world.step(1/60, this.oldElapsedTime, 3)
            this.renderer.render(this.scene, this.camera)
            this.controls.update()
            this.stats.update() 
            this.Update()
        })  
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})
