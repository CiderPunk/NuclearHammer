import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { IGame, IInputManager } from "../interfaces";
import { Person } from "./person";

export class Player extends Person{

  public constructor(name:string, owner:IGame, readonly input:IInputManager){
    super(name, owner, { radiusTop:1, radiusBottom:1.6, height:6, start:new Vector3(0,5,0), capsuleBottom:-1.6, color:Color3.Green(), canterOfGravity:-3.5,offset:-3 , showForce:false })
  }


  
  update(dT: number): void {

    this.aliveTime+=dT

    //console.log(this.input.move)


    const force = new Vector3(30 * Math.sin(this.aliveTime * 0.0005),0,30* Math.cos(this.aliveTime  * 0.0005))
    const point = this.forcePoint.getAbsolutePosition()

    this.body.applyForce(force, point)
    if (this.showForcePointer){
    this.forcePointer.set(point,force)
    }



  }

}