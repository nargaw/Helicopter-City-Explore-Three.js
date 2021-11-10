import './style.css'
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
const canvas = document.querySelector('.webgl')

class NewScene{
    constructor(){
        this._Init()
    }
    
    _Init(){
        this.scene = new THREE.Scene()
        this.clock = new THREE.Clock()
        this.InitCamera()
        this.InitEnv()
        this.InitBuildings()
        this.InitRenderer()
        this.InitControls()
        this.Update()
        window.addEventListener('resize', () => {
            this.Resize()
        })
    }

    InitEnv(){
        this.planeGeomtery = new THREE.PlaneGeometry(1000, 1000)
        this.planeMaterial = new THREE.MeshNormalMaterial({
            side: THREE.DoubleSide
        })
        this.plane = new THREE.Mesh(this.planeGeomtery, this.planeMaterial)
        this.plane.rotation.x = -Math.PI * 0.5
        this.scene.add(this.plane)
    }

    InitBuildings(){
        let x, y, z
        this.rand = 10 + Math.random() * 25;
        this.buildingGeometry = new THREE.BoxGeometry(x, this.rand, z)
        this.buildingMaterial = new THREE.MeshNormalMaterial()
        for (let i = 0; i <= 100; i++){
            x = Math.round(Math.random()*20+10)
            z = Math.round(Math.random()*20+10)
            this.angle = Math.random() * Math.PI * 2
            this.radius = 5 + Math.random() * 100
            this.posX = Math.cos(this.angle) * this.radius
            this.posZ = Math.sin(this.angle) * this.radius
            this.building = new THREE.Mesh(this.buildingGeometry, this.buildingMaterial)
            this.scene.add(this.building)
            this.building.position.set(this.posX, this.rand/2, this.posZ)
        }
    }

    InitCamera(){
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000)
        this.camera.position.set(0, 0.5, 4)
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
            this.renderer.render(this.scene, this.camera)
            this.controls.update()
            this.Update()
        })  
    }
}

let _APP = null

window.addEventListener('DOMContentLoaded', () => {
    _APP = new NewScene()
})