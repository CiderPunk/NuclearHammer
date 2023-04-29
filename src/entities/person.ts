import { AbstractMesh, CreateCapsule, TransformNode } from "@babylonjs/core/Meshes";
import { IEntity, IGame } from "../interfaces";
import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { PhysicsBody, PhysicsMotionType, PhysicsShapeCapsule, PhysicsShapeContainer } from "@babylonjs/core/Physics";
import { Pointer } from "../helpers/pointer";
import { Scene } from "@babylonjs/core/scene";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

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
  color?:Color3
}



export class Person implements IEntity{
  rootMesh: AbstractMesh
  forcePoint:TransformNode
  body:PhysicsBody
  aliveTime = 0
  forcePointer:Pointer
  showForcePointer:boolean = false

  public constructor(readonly name:string, readonly owner:IGame, personOptions:IPersonOptions){
    //defaults
    const options = {
      height:4,
      radiusTop:0.8,
      radiusBottom:1.2,
      offset:-1.6,
      capsuleBottom:-1,
      capsuleTop:0.4,
      canterOfGravity:-2,
      mass:10, 
      showForce:false,
      start:new Vector3(0,0,0),
      color:Color3.Gray()
    }

    Object.assign(options, personOptions)
  
    const scene = owner.scene
    const forcePoint = new TransformNode(`${name}_transform`, scene)
    const torso = CreateCapsule(`${name}_body`, {  height:options.height, radius:options.radiusTop, radiusTop:options.radiusTop, radiusBottom:options.radiusBottom }, scene)   

    const mat = new StandardMaterial(`${name}_mat`, scene)
    mat.diffuseColor = options.color
    torso.material = mat

    forcePoint.setAbsolutePosition(new Vector3(0,options.offset,0))
    forcePoint.parent = torso
    torso.setAbsolutePosition(new Vector3(0,5,0))
    const shape = new PhysicsShapeCapsule(new Vector3(0,options.capsuleBottom,0), new Vector3(0,options.capsuleTop,0),options.radiusBottom, scene)
    const body = new PhysicsBody(torso,PhysicsMotionType.DYNAMIC, false, scene)
    body.shape = shape
    body.setMassProperties({ mass:options.mass, centerOfMass:new Vector3(0,options.canterOfGravity,0) })
    this.rootMesh = torso
    this.body = body
    this.forcePointer = new Pointer(`${name}_pointer`, scene, Color3.Blue(),true)
    this.forcePoint = forcePoint
    this.showForcePointer = options.showForce
    this.forcePointer.setVisible(options.showForce)
    
    this.body.disablePreStep = false;
    this.body.transformNode.setAbsolutePosition(options.start)
    owner.scene.onAfterRenderObservable.addOnce(() => {
      // Turn disablePreStep on again for maximum performance
      this.body.disablePreStep = true;
    })
  }
 


  update(dT: number): void {

    this.aliveTime+=dT

    const force = new Vector3(30 * Math.sin(this.aliveTime * 0.0005),0,30* Math.cos(this.aliveTime  * 0.0005))
    const point = this.forcePoint.getAbsolutePosition()

    this.body.applyForce(force, point)
    if (this.showForcePointer){
    this.forcePointer.set(point,force)
    }



  }



}