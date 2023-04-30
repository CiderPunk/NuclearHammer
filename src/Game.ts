import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Scene } from "@babylonjs/core/scene";
import { IConfigurationProvider, IEntity, IGame } from "./interfaces";
//import { Pointer } from "./helpers/pointer";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins"
import "@babylonjs/core/Physics/v2/physicsEngineComponent"
//import "@Babylonjs/core/Particles/webgl2ParticleSystem"

import {BaseParticleSystem, ParticleHelper} from "@babylonjs/core/Particles"

import { PhysicsAggregate, PhysicsHelper, PhysicsRadialImpulseFalloff, PhysicsShapeType } from "@babylonjs/core/Physics"

//spector start
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent


import { AbstractMesh, CreateBox, TransformNode } from "@babylonjs/core/Meshes";
import { Player } from "./entities/player";
import { InputManager } from "./InputManager";
import { Kid } from "./entities/kid";
import { Level } from "./Level";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera";
import { Constants } from "./constants";
import { ConfigurationProvider } from "./ConfigurationProvider";


export class Game implements IGame{
  readonly engine: Engine;
  readonly scene: Scene;
  ground: any;
  sphere: any;
  material: any;
  freeCamera: FreeCamera;
  player?: IEntity;

  readonly ents = new Array<IEntity>()
  physicsHelper?: PhysicsHelper;
  gameReady: any;
  inputManager: InputManager;
  level?: Level;
  emitter: AbstractMesh;
  gameCamera: TargetCamera;
  ConfigurationProvider: IConfigurationProvider


  
  public makeNuke(point:Vector3, radius:number,  strength:number):void{
    this.physicsHelper!.applyRadialExplosionForce(point.add(new Vector3(0,0,0)), radius, strength, PhysicsRadialImpulseFalloff.Linear )
 


    ParticleHelper.CreateAsync("explosion", this.scene).then((set) => {
      this.emitter.setAbsolutePosition(point)
      set.systems.forEach(s => {
        s.emitter = this.emitter
        s.disposeOnStop = true;
      });
      set.start();
    });
  }

  public constructor(element:string){


    this.ConfigurationProvider  = new ConfigurationProvider()
    // Get the canvas element from the DOM.
    const canvas = document.getElementById(element) as HTMLCanvasElement;

    // Associate a Babylon Engine to it.
    this.engine = new Engine(canvas);

    // Create our first scene.
    this.scene = new Scene(this.engine);
    
    //oh god why?!?!?
    this.scene.useRightHandedSystem = true

    const cam = new TargetCamera("gamecam",  new Vector3().copyFrom(Constants.cameraOffset), this.scene)
    cam.setTarget(new Vector3(0,0,0))
    this.gameCamera = cam

    // This creates and positions a free camera (non-mesh)
    this.freeCamera = new FreeCamera("camera1", new Vector3(0, 20, -30), this.scene);

    // This targets the camera to scene origin
    this.freeCamera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    this.freeCamera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    //const light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);

    // Default intensity is 1. Let's dim the light a small amount
    //light.intensity = 0.7;

    // Create a grid material
    //this.material = new GridMaterial("grid", this.scene);
    //this.material.gridRatio = 0.1
    

    //emitter dummy
    this.emitter = CreateBox("em", {size:0.01}, this.scene)

    this.emitter.isVisible = false
    
    const inputManager = new InputManager(this)
    inputManager.toggleDebug = ()=>{  
      console.log("show debug")
      this.scene.debugLayer.isVisible() ? this.scene.debugLayer.hide() : this.scene.debugLayer.show()
    }

    inputManager.togggleCamera = ()=>{  
      console.log("camera toggle")
       this.scene.activeCamera = (this.scene.activeCamera === this.gameCamera ? this.freeCamera : this.gameCamera )
    }



    this.inputManager = inputManager

    //const axes = new AxesViewer(this.scene, 10)

    HavokPhysics().then((havok) => {
      this.scene.enablePhysics(new Vector3(0,-9.81, 0), new HavokPlugin(true, havok));
      /*

 // Our built-in 'ground' shape.
    this.ground = CreateGround('ground1', { width: 100, height: 100, subdivisions: 1 }, this.scene);
    this.ground.material = this.material;


      const groundAggrergate = new PhysicsAggregate(this.ground, PhysicsShapeType.BOX, { mass:0}, this.scene)
      //build some walls
      for (let i = 0; i<4; i++){
        const wall = CreateBox(`wall_${i}`, { width:100, height:4, depth:1 }, this.scene)
        const wallAggregate = new PhysicsAggregate(wall, PhysicsShapeType.BOX, { mass:0}, this.scene)
        wallAggregate.body.disablePreStep = false
        wallAggregate.body.transformNode.setAbsolutePosition(new Vector3(50 * Math.sin(i * Math.PI * 0.5),2, 50 * Math.cos(i * Math.PI * 0.5)))
        wallAggregate.body.transformNode.rotate(Vector3.Up(), Math.PI * 0.5 * i )
        this.scene.onAfterRenderObservable.addOnce(() => {
          wallAggregate.body.disablePreStep = true
        })
      }
*/
      //this.ents.push(new TestShape("test", this))

      this.physicsHelper = new PhysicsHelper(this.scene)

      // Render every frame
      this.engine.runRenderLoop(() => {
        if (this.gameReady){
          this.render()
        }
      })
      
      this.level  = new Level(this, "map1.gltf", this.ConfigurationProvider.config.enableShadows!)
    });

  
  }


  startGame(){
    //spawn kids
    const kids = this.spawnKids(30, 15)
    
    kids.forEach(k=>{
      this.ents.push(k)
      this.level?.addShadowCaster(k.rootMesh)
    })

    this.player = new Player("player1", this, this.inputManager)
    this.level?.addShadowCaster(this.player.rootMesh)
    
    this.ents.push(this.player)
    this.gameReady = true

  }

  spawnKids(count:number, spread:number = 20):Array<Kid> {
    const res = new Array<Kid>()
    for (var i = 0; i < count; i++){
      const ang = Math.PI * 2 *Math.random()
      const dist = Math.random() * spread
      const kid = new Kid("kid"+i, this, new Vector3(dist* Math.sin(ang), 5,dist*(Math.cos(ang))),Math.random() * 200000)
      res.push(kid)
    }
    return res
  }
 

  render(){
    if (this.player){
      this.gameCamera.position.copyFrom(this.player.getPosition()).addInPlace(Constants.cameraOffset)
      this.gameCamera.update()
    //  this.camera.setTarget(this.player.rootMesh.position)
    }
    const dT = this.engine.getDeltaTime();
    this.ents.forEach(e=>{ e.update(dT)})
    this.scene.render()

  }
}