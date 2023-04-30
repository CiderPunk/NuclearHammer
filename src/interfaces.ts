import { Vector2, Vector3 } from "@babylonjs/core/Maths/math";
import { TransformNode } from "@babylonjs/core/Meshes";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { IDisposable, Scene } from "@babylonjs/core/scene";

export interface IGame{
  startGame(): void;
  scene:Scene
  makeNuke(point:Vector3, radius:number,  strength:number):void

  goalEffect(point:Vector3, direction:Vector3):void
  ConfigurationProvider:IConfigurationProvider
  assContainer:AssetContainer
  rootNode: TransformNode
}

export interface IEntity{
  rootMesh:AbstractMesh
  update(dT:number):void
  getPosition():Vector3
  setPosition(pos:Vector3):void
}

export interface IKid{
  active:boolean
  reachedGoal():void

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