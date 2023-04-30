import { Vector3 } from "@babylonjs/core/Maths/math";

export const Constants = {
  thinkTime: 400,
  megaThinkPeriod: 10,
  cameraOffset:new Vector3(0, 50,-50),
  enableShadows:false
} as const



export enum CollisionMask{
  Goal = 1 << 0,
  Player = 1 << 1,
  Kid  = 1 << 2,
}