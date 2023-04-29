import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { IGame, IInputManager } from "../interfaces";
import { Person } from "./person";

export class Player extends Person{

  public constructor(name:string, owner:IGame, input:IInputManager){
    super(name, owner, { radiusTop:1, radiusBottom:1.6, height:6, start:new Vector3(0,5,0), capsuleBottom:-1.6, color:Color3.Green(), canterOfGravity:-3.5,offset:-3 , showForce:false })
  }

}