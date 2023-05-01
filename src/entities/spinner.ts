
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { AbstractMesh, CreateCylinder } from "@babylonjs/core/Meshes";
import { IEntity, IGame } from "../interfaces";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeCylinder } from "@babylonjs/core/Physics/v2/physicsShape";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";

export class Spinner implements IEntity{
  rootMesh: AbstractMesh;
  body: PhysicsBody;

  public constructor(readonly name:string, readonly owner:IGame, pivot:Vector3, speed:number, length:number){
    this.rootMesh = CreateCylinder(`${name}_spinner`, { height:length, diameter:3})
    const shape = new PhysicsShapeCylinder(new Vector3(0,-length *0.5,0), new Vector3(0,length*0.5,0), 1.5, owner.scene)
    const body  = new PhysicsBody(this.rootMesh,PhysicsMotionType.ANIMATED, false, owner.scene)
    body.shape = shape
    this.body = body
    this.setPosition(pivot)
    body.transformNode.rotate(Vector3.Left(), Math.PI * 0.5)
    body.setAngularVelocity(new Vector3(0,0,speed))
  }

  update(dT: number): void {
 
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


  dispose(): void {
    this.body.dispose()
    this.rootMesh.dispose()
  }

  
}