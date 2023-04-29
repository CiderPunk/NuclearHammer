import { Vector3 } from "@babylonjs/core/Maths/math";
import { IGame } from "../interfaces";
import { Person } from "./person";
import { Constants } from "../constants";

export class Kid extends Person{
  targetVector: Vector3;
  nextThink: number;

  public constructor(name:string, owner:IGame, startPoint:Vector3, nextThink:number){
    super(name, owner, { start:startPoint})
    this.nextThink = nextThink
    const initDir = Math.random() * 2 * Math.PI;
    this.targetVector = new Vector3( Math.sin(initDir),0,Math.cos(initDir)  )
  }


  update(dT: number): void {
    this.aliveTime+=dT

    if (this.aliveTime > this.nextThink){
      while (this.aliveTime > this.nextThink){
        this.nextThink = this.aliveTime + Constants.thinkTime
      }
      
      this.body.getLinearVelocityToRef(this.targetVector)
      this.targetVector.normalize()
    }


    const force = this.targetVector.scale(20).addInPlace(new Vector3(5 * Math.sin(this.aliveTime * 0.001),0,5 * Math.cos(this.aliveTime  * 0.001)))
    const point = this.forcePoint.getAbsolutePosition().addInPlace(new Vector3(2 * Math.sin(this.aliveTime * 0.005),0,2 * Math.cos(this.aliveTime  * 0.005)))
    this.body.applyForce(force, point)
    if (this.showForcePointer){
      this.forcePointer.set(point,force)
    }
  }



}