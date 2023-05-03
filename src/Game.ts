import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Color3, Color4, Vector3 } from "@babylonjs/core/Maths/math";
import { Scene } from "@babylonjs/core";
import { IConfigurationProvider, IEntity, IGame, ILevelSpec } from "./interfaces";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins"
import "@babylonjs/core/Physics/v2/physicsEngineComponent"
import { GPUParticleSystem, ParticleHelper} from "@babylonjs/core/Particles"
import { PhysicsHelper, PhysicsRadialImpulseFalloff } from "@babylonjs/core/Physics"

//spector start
import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent

import { AbstractMesh, CreateBox, TransformNode } from "@babylonjs/core/Meshes"
import { Player } from "./entities/player"
import { InputManager } from "./InputManager"
import { Kid } from "./entities/kid"
import { Level } from "./Level"

import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera"
import { Constants } from "./constants";
import { ConfigurationProvider } from "./ConfigurationProvider"
import { Texture } from "@babylonjs/core/Materials/Textures/texture"
import { Person } from "./entities/person"
import {AssetsManager} from "@babylonjs/core/Misc/assetsManager"
import { AssetContainer, KeepAssets } from "@babylonjs/core/assetContainer"
import {AdvancedDynamicTexture, TextBlock } from "@babylonjs/gui/2D"
import { Spinner } from "./entities/spinner";

export class Game implements IGame{
  readonly engine: Engine
  readonly scene: Scene
  player?: IEntity

  readonly ents = new Array<IEntity>()
  physicsHelper?: PhysicsHelper
  gameReady: boolean = false
  inputManager: InputManager
  level?: Level
  emitter: AbstractMesh
  gameCamera: TargetCamera
  configProvider: IConfigurationProvider
  assContainer: AssetContainer
  rootNode: TransformNode
  infoBox: TextBlock
  infoTimeout?: NodeJS.Timeout
  goalCount: number = 0
  currentLevel?: ILevelSpec
  freeCamera: FreeCamera

  levels:Array<ILevelSpec> = [ 
    { filename:"map1.gltf", goal:5, kids:30, spawnRadius:15, intro:"Get those kids to school!\nThe only way you know how;\nWith your trusty\nNuclear Impact Hammer!\n"},
   // { filename:"map1.gltf", goal:5, kids:100, spawnRadius:18, intro:"Level 2\n"},
    { filename:"map2.gltf", goal:10, kids:30, spawnRadius:15, intro:"Level 2\n"},
    { filename:"map3.gltf", goal:5, kids:30, spawnRadius:15, intro:"Level 3!\n"},
    { filename:"map1.gltf", goal:10, kids:100, spawnRadius:18, intro:"Oh no!\n"},
  ]

  
  public constructor(element:string){

    const keepAssets = new KeepAssets()
    this.configProvider  = new ConfigurationProvider()
    // Get the canvas element from the DOM.
    const canvas = document.getElementById(element) as HTMLCanvasElement;

    // Associate a Babylon Engine to it.
    this.engine = new Engine(canvas);

    // Create our first scene.
    this.scene = new Scene(this.engine);


    const inputManager = new InputManager(this)
    inputManager.toggleDebug = ()=>{  
      console.log("show debug")
      this.scene.debugLayer.isVisible() ? this.scene.debugLayer.hide() : this.scene.debugLayer.show()
    }

    inputManager.togggleCamera = ()=>{  
      console.log("camera toggle")
       this.scene.activeCamera = (this.scene.activeCamera === this.gameCamera ? this.freeCamera : this.gameCamera )
    }

    inputManager.nextLevel = ()=>{
      console.log("next level")
      if (this.goalCount < this.currentLevel!.goal){
        this.configProvider.setConfig({ level: this.configProvider.config.level! + 1})
        this.loadLevel(this.levels[this.configProvider.config.level! % this.levels.length])
      }
      else{
        const delivered = this.currentLevel!.kids - this.goalCount
        const need = this.goalCount - this.currentLevel!.goal 
        this.showInfo(`You've delivered ${delivered} truants to school\nYou need ${need} more`)
      }
    }

    this.inputManager = inputManager



   
    this.scene.ambientColor = new Color3(0.9,0.8,0.1)
    this.scene.clearColor = new Color4(0.4,0.5,0.7,1.0)

    //oh god why?!?!?
    this.scene.useRightHandedSystem = true

    this.rootNode= new TransformNode("root", this.scene)

    const cam = new TargetCamera("gamecam",  new Vector3().copyFrom(Constants.cameraOffset), this.scene)
    cam.setTarget(new Vector3(0,0,0))
    this.gameCamera = cam
    // This creates and positions a free camera (non-mesh)
    this.freeCamera = new FreeCamera("camera1", new Vector3(0, 20, -30), this.scene);

    keepAssets.cameras.push(this.gameCamera, this.freeCamera)

    // This targets the camera to scene origin
    this.freeCamera.setTarget(Vector3.Zero());

    // This attaches the camera to the canvas
    this.freeCamera.attachControl(canvas, true);

    //emitter dummy
    this.emitter = CreateBox("emitter", {size:0.01}, this.scene)
    keepAssets.meshes.push(this.emitter)
    this.emitter.isVisible = false
    

    const gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    //info text box
    const info  = new TextBlock();
    info.color = "white"
    info.fontSize = "48px"
    //info.top = "20%"
    //info.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP
    gui.addControl(info)
    this.infoBox = info

    //this.showInfo("Get those kids to school!\nThe only way you know how;\nWith your trusty\nNuclear Impact Hammer!\n")

    //set up physics
    HavokPhysics().then((havok) => {
      this.scene.enablePhysics(new Vector3(0,-9.81, 0), new HavokPlugin(true, havok));
      this.physicsHelper = new PhysicsHelper(this.scene)
      // Render every frame
      this.engine.runRenderLoop(() => {
        if (this.gameReady){
          this.render()
        }
      })
    });

    const assMan = new AssetsManager()
    //load some stuff...
    Person.preload(assMan)
    assMan.loadAsync()

    this.assContainer = new AssetContainer(this.scene)
    assMan.onFinish = (tasks)=>{
      this.assContainer.moveAllFromScene(keepAssets)
      this.loadLevel(this.levels[this.configProvider.config.level! % this.levels.length])
    };
  }

  spawnSpinner(pivot: Vector3): void {
    this.ents.push(new Spinner("spinner1", this, pivot, Math.PI * 0.15, 80))
  }
  

  loadLevel(levelSpec:ILevelSpec){
    if (this.level){
      this.level.dispose()
      this.ents.forEach(e=>e.dispose())
      this.ents.length = 0
    }
    this.showInfo(levelSpec.intro)
    this.currentLevel = levelSpec
    this.level  = new Level(this, levelSpec.filename, this.configProvider.config.enableShadows!)
  }

  
  public goalEffect(point:Vector3, direction:Vector3){
    var particleSystem = new GPUParticleSystem("particles", { capacity:1000 }, this.scene);
    particleSystem.particleTexture = new Texture("assets/flare.png", this.scene);
    // Colors of all particles
    particleSystem.color1 = new Color4(0.7, 0.8, 1.0, 1.0);
    particleSystem.color2 = new Color4(0.2, 0.5, 1.0, 1.0);
    particleSystem.colorDead = new Color4(0, 0, 0.2, 0.0);

    particleSystem.maxLifeTime = 5;
    particleSystem.minSize = 0.2;
    particleSystem.maxSize = 0.8;
   // particleSystem.emitter = point;
    // Speed
    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.005;
    particleSystem.emitter = point
    particleSystem.createSphereEmitter(3)
    
    particleSystem.emitRate = 1000
    particleSystem.start()
    setTimeout(()=>{ particleSystem.dispose() }, 500)
  }    

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

  
  
  goalHit(): void {
    this.goalCount--
    if (this.goalCount < this.currentLevel!.goal){
      this.showInfo("Goal reached\nPress Enter to continue", 2000)
    }
    if (this.goalCount  == 0){
      this.showInfo("You got them all!\nPress Enter to continue", 5000)
    }
  }


  showInfo(text:string, duration:number = 4000):void{
    clearTimeout(this.infoTimeout)
    this.infoBox.text = text
    this.infoTimeout = setTimeout(()=>{ this.infoBox.text = ""}, duration)
  }

  startGame(){
    //spawn kids
    const kids = this.spawnKids(this.currentLevel!.kids,this.currentLevel!.spawnRadius)
    
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
    this.goalCount = count

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