import { PhysicsEngine, PhysicsRaycastResult } from "@babylonjs/core/Physics";
import { IGame } from "./interfaces";
import { Vector3 } from "@babylonjs/core/Maths";


export class Raycaster{
  raycastResult: PhysicsRaycastResult;
  physicsEngine: PhysicsEngine;
  public constructor(readonly owner:IGame){
    const pe = owner.scene.getPhysicsEngine()
    this.physicsEngine = pe as PhysicsEngine
    this.raycastResult = new PhysicsRaycastResult()
  }

  raycast(start:Vector3, end:Vector3):PhysicsRaycastResult{
    this.physicsEngine.raycastToRef(start,end, this.raycastResult)
    return this.raycastResult
  }

}