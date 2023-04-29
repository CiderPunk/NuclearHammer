
import { Person } from "./person";
import { IGame } from "../interfaces";
import { Vector3 } from "@babylonjs/core/Maths/math";

export class Rando extends Person{
  public constructor(name:string, owner:IGame, startPoint:Vector3, tOfss:number){
    super(name, owner, { start:startPoint})
    this.aliveTime = tOfss

  }


}