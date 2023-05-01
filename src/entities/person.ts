import { AbstractMesh, CreateCapsule, TransformNode } from "@babylonjs/core/Meshes";
import { IEntity, IGame } from "../interfaces";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { PhysicsBody, PhysicsMotionType, PhysicsShape, PhysicsShapeCapsule, PhysicsShapeContainer } from "@babylonjs/core/Physics";

import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { AssetContainer } from "@babylonjs/core/assetContainer";

import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";

export interface IPersonOptions  { 
  height?:number,
  radiusTop?:number,
  radiusBottom?:number,
  offset?:number,
  capsuleBottom?:number,
  capsuleTop?:number,
  canterOfGravity?:number,
  mass?:number,
  showForce?:boolean,
  start?:Vector3,
  texture?:string
  restitution?:number, 
  friction?:number
  createMat?:boolean
}



export class Person implements IEntity{
  rootMesh: AbstractMesh
  //anchor we apply forces to
  forcePoint:TransformNode
  body:PhysicsBody
  aliveTime = 0
  shape: PhysicsShape;


  static personMesh?:AbstractMesh

  public static async preload(assMan:AssetsManager){
    assMan.addMeshTask("weebleLoad", "weeble", "assets/", "weeble.glb").onSuccess = (task)=>{
      Person.personMesh = task.loadedMeshes.find(m=>m.name === "weeble")
    }
  }

  public constructor(readonly name:string, readonly owner:IGame, personOptions:IPersonOptions){
    //defaults
    const options:IPersonOptions = {
      height:4,
      radiusTop:0.8,
      radiusBottom:1.2,
      offset:-2,
      capsuleBottom:-1,
      capsuleTop:0.4,
      canterOfGravity:-1.4,
      mass:10, 
      showForce:false,
      createMat:true,
      texture:"assets/player.png",
      restitution:0.7,
      friction:0.3
    }

    Object.assign(options, personOptions)
  
    const scene = owner.scene
    const forcePoint = new TransformNode(`${name}_transform`, scene)



    //const torso = CreateCapsule(`${name}_body`, {  height:options.height, radius:options.radiusTop, radiusTop:options.radiusTop, radiusBottom:options.radiusBottom }, scene)   
    if (!Person.personMesh){
      throw Error("Person mesh not loaded")
    }
  
    const torso = Person.personMesh!.clone(`${name}_body`, owner.rootNode )
    
    if (options.createMat){
      const mat = new StandardMaterial(`${name}_mat`, scene)
      //mat.diffuseColor = options.color!
      const tex =  new Texture(options.texture!, owner.scene, false,false);

      mat.diffuseTexture = tex


      torso!.material = mat
    }

    forcePoint.setAbsolutePosition(new Vector3(0,options.offset,-0.8))
    forcePoint.parent = torso
    torso!.setAbsolutePosition(new Vector3(0,5,0))
    const shape = new PhysicsShapeCapsule(new Vector3(0,options.capsuleBottom,0), new Vector3(0,options.capsuleTop,0),options.radiusBottom!, scene)

    shape.material =  {friction: options.friction, restitution: options.restitution};
    const body = new PhysicsBody(torso!,PhysicsMotionType.DYNAMIC, false, scene)
    body.shape = shape
    body.setMassProperties({ mass:options.mass, centerOfMass:new Vector3(0,options.canterOfGravity,0) })
    this.rootMesh = torso!
    
    
    body.setAngularDamping(2)
    this.body = body
    this.forcePoint = forcePoint
    this.shape = shape

    if (options.start){
      this.setPosition(options.start)
    }

  }
  dispose(): void {
    this.body.dispose()
    this.rootMesh.dispose()
  }
 
  getPosition():Vector3{
    return this.body.transformNode.getAbsolutePosition()
  }


  setPosition(pos:Vector3):void{
    this.body.disablePreStep = false;
    this.body.transformNode.setAbsolutePosition(pos)
    this.owner.scene.onAfterRenderObservable.addOnce(() => {
      // Turn disablePreStep on again for maximum performance
      this.body.disablePreStep = true;
    })

  }

  update(dT: number): void {
    this.aliveTime+=dT
    const force = new Vector3(30 * Math.sin(this.aliveTime * 0.0005),0,30* Math.cos(this.aliveTime  * 0.0005))
    const point = this.forcePoint.getAbsolutePosition()
    this.body.applyForce(force, point)
    /*
    if (this.showForcePointer){
      this.forcePointer.set(point,force)
    }
    */
  }



}