import { Vector2, Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Scene } from "@babylonjs/core/scene";

export interface IGame{
  scene:Scene
  makeNuke(point:Vector3, radius:number,  strength:number):void
}

export interface IEntity{
  rootMesh:AbstractMesh
  update(dT:number):void
}


export interface IInputManager{
  fire:boolean
  move:Vector2
}