import { Color3, Vector3 } from "@babylonjs/core/Maths/math";
import { IGame, IKid } from "../interfaces";
import { Person } from "./person";
import { CollisionMask, Constants } from "../constants";
import { Context } from "@babylonjs/inspector/components/actionTabs/tabs/propertyGrids/animations/curveEditor/context";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";

export class Kid extends Person implements IKid{
  targetVector: Vector3;
  nextThink: number;
  megaThink: number;
  active: boolean;

  public constructor(name:string, owner:IGame, startPoint:Vector3, aliveTime:number){

    const tex = Math.floor(Math.random() *6) + 1
    super(name, owner, { start:startPoint, texture:`assets/kid${tex}.png`})
    
    this.shape.filterMembershipMask = CollisionMask.Kid
    this.shape.filterCollideMask = CollisionMask.Kid| CollisionMask.Player | CollisionMask.Goal

    this.body._pluginData.entity = this

    this.aliveTime = aliveTime
    this.nextThink = aliveTime + Constants.thinkTime
    this.megaThink = Math.floor(Constants.megaThinkPeriod * Math.random())
    const initDir = Math.random() * 2 * Math.PI;
    this.targetVector = new Vector3( Math.sin(initDir),0,Math.cos(initDir)  )

    this.active = true
  }

  reachedGoal(): void {
    this.active = false
    
    this.owner.goalEffect(this.body.transformNode.getAbsolutePosition(), this.targetVector)
    //this.setPosition(new Vector3(0,-10000,0))
    this.body.dispose()
    this.rootMesh.setEnabled(false)

    //setTimeout(()=>{this.body.dispose()}, 100)
  }


  update(dT: number): void {
    if (!this.active){ return}
    this.aliveTime+=dT
    if (this.aliveTime > this.nextThink){


      this.nextThink = this.aliveTime + Constants.thinkTime
      if (this.megaThink-- <=0){
        this.megaThink = Constants.megaThinkPeriod
      
        //const mat = this.rootMesh.material as StandardMaterial
        //mat.diffuseColor = new Color3(Math.random(), Math.random(), Math.random())
       
       /*
        var angle = Math.tanh(this.targetVector.x / this.targetVector.z ===0 ? 0.00001 : this.targetVector.z)
        angle += (Math.random() * Math.PI * 1)
        this.targetVector.set(Math.cos(angle), 0, Math.sin(angle))

        console.log(`${this.name} angle ${angle}`)

*/
      }
      else{
        this.body.getLinearVelocityToRef(this.targetVector)
        this.targetVector.normalize()
      }
    }


    const force = this.targetVector.scale(20).addInPlace(new Vector3(10 * Math.sin(this.aliveTime * 0.001),0,10 * Math.cos(this.aliveTime  * 0.001)))
    const point = this.forcePoint.getAbsolutePosition().addInPlace(new Vector3(3 * Math.sin(this.aliveTime * 0.005),0,3 * Math.cos(this.aliveTime  * 0.005)))
    this.body.applyForce(force, point)

  }



}