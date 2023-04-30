import { Vector2, Vector3 } from "@babylonjs/core/Maths/math";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { IDisposable, Scene } from "@babylonjs/core/scene";

export interface IGame{
  startGame(): void;
  scene:Scene
  makeNuke(point:Vector3, radius:number,  strength:number):void
  ConfigurationProvider:IConfigurationProvider
}

export interface IEntity{
  rootMesh:AbstractMesh
  update(dT:number):void
  getPosition():Vector3
  setPosition(pos:Vector3):void
}


export interface ILevel{
  addShadowCaster(mesh:AbstractMesh):void

}

export interface IPerson extends IEntity{}

export interface IInputManager{
  fire:boolean
  jump:boolean
  move:Vector2
}


export interface IConfiguration{
  enableShadows?:boolean
  level?:number
}

export interface IConfigurationProvider{
  config:IConfiguration
  setConfig(newSettings:IConfiguration):void

}