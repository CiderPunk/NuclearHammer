import { Color3, Vector3, Vector4 } from "@babylonjs/core/Maths/math";
import { IGame, IInputManager } from "../interfaces";
import { Person } from "./person";
import { AbstractMesh, CreateCylinder, TransformNode } from "@babylonjs/core/Meshes";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { BallAndSocketConstraint, HingeConstraint, Physics6DoFConstraint, PhysicsBody, PhysicsConstraint, PhysicsConstraintAxis, PhysicsHelper, PhysicsMotionType, PhysicsShapeCylinder } from "@babylonjs/core/Physics";
import { GridMaterial } from "@babylonjs/materials/grid/gridMaterial";
import { CollisionMask } from "../constants";
import { Nullable } from "@babylonjs/core/types";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";


/*
interface HingeConstraints{
  rest:Physics6DoFConstraint
  draw:Physics6DoFConstraint
  swing:Physics6DoFConstraint
}
*/
enum HammerState{
  draw,
  rest,
  swing,
}



export class Player extends Person{

  hammerState = HammerState.rest
  contraints = new Array<Physics6DoFConstraint>()
  drawTime = 0
  hammerBody: PhysicsBody;
  swingTime = 0;
  primed = false

  meshes = new Array<AbstractMesh>()
  jumpTimeout: number = 0

  public constructor(name:string, owner:IGame, readonly input:IInputManager){
    super(name, owner, { radiusTop:1, radiusBottom:1.6, height:5, capsuleBottom:-1.2, canterOfGravity:-3,offset:-3.1 , showForce:false, mass:60, createMat:true  })
    
    this.shape.filterMembershipMask = CollisionMask.Player
    this.shape.filterCollideMask = CollisionMask.Kid | CollisionMask.Goal

    this.rootMesh.scaling.set(1.2,1.2,1.2)

    //responsive controls
     this.body.setLinearDamping(0.5)
    
    const hammerMat = new StandardMaterial("hammer_mat", owner.scene)
    hammerMat.diffuseColor = new Color3(1,0.8,0.05)
    hammerMat.specularPower = 50

    const hammerHead =  CreateCylinder(`${name}_hammer_head`,{ height:2, subdivisions:8, diameter:1.4 }, owner.scene)
    const hammerShaft =  CreateCylinder(`${name}_hammer_shaft`,{ height:3, subdivisions:6, diameter:0.4 }, owner.scene)
    hammerShaft.rotate(Vector3.Left(), Math.PI * 0.5)
    hammerShaft.position.z-=2
    hammerHead.material = hammerMat
    hammerShaft.material = hammerMat



    const shape = new PhysicsShapeCylinder(new Vector3(0,-1,0), new Vector3(0,1,0), 0.7, owner.scene)
    
    shape.material = { friction:2, restitution:0.1}
    const hammerBody = new PhysicsBody(hammerHead,PhysicsMotionType.DYNAMIC, false, owner.scene)
    hammerBody.shape = shape
    hammerBody._pluginData.entity = this
    
    hammerBody.setMassProperties({ mass:0.2})
    hammerShaft.setParent(hammerBody.transformNode)

    this.meshes.push(hammerShaft, hammerHead)

    //const hingeConstraint = new HingeConstraint(new Vector3(1.5,0,0), new Vector3(0,0,-3), Vector3.Right(), Vector3.Right(), owner.scene)

    const hammerConstraintSwing = new Physics6DoFConstraint(
      {pivotA: new Vector3(1.5,0,0), pivotB:new Vector3(0,0,-3), perpAxisA:Vector3.Right(), perpAxisB:Vector3.Right()},
      [
        { axis: PhysicsConstraintAxis.ANGULAR_X,minLimit:Math.PI * -0.3 ,maxLimit:Math.PI * -1.2     },
        { axis: PhysicsConstraintAxis.ANGULAR_Y, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.ANGULAR_Z, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_X, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_Y, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_Z, minLimit:0, maxLimit:0},
      ],
      owner.scene)

    const hammerConstraintRest = new Physics6DoFConstraint(
      {pivotA: new Vector3(1.5,0,0), pivotB:new Vector3(0,0,-3), perpAxisA:Vector3.Right(), perpAxisB:Vector3.Right()},
      [
        { axis: PhysicsConstraintAxis.ANGULAR_X,minLimit:Math.PI * -0.5 ,maxLimit:Math.PI * -0.5  },
        { axis: PhysicsConstraintAxis.ANGULAR_Y, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.ANGULAR_Z, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_X, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_Y, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_Z, minLimit:0, maxLimit:0},
      ],
      owner.scene)


    const hammerConstraintDraw = new Physics6DoFConstraint(
      {pivotA: new Vector3(1.5,0,0), pivotB:new Vector3(0,0,-3), perpAxisA:Vector3.Right(), perpAxisB:Vector3.Right()},
      [
        { axis: PhysicsConstraintAxis.ANGULAR_X,minLimit:Math.PI * -0.3 ,maxLimit:Math.PI * -0.3  },
        { axis: PhysicsConstraintAxis.ANGULAR_Y, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.ANGULAR_Z, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_X, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_Y, minLimit:0, maxLimit:0 },
        { axis: PhysicsConstraintAxis.LINEAR_Z, minLimit:0, maxLimit:0},
      ],
      owner.scene)

    this.contraints[HammerState.draw]  = hammerConstraintDraw;
    this.contraints[HammerState.rest]  = hammerConstraintRest;
    this.contraints[HammerState.swing]  = hammerConstraintSwing;
    
    this.contraints.forEach(c=>{
      this.body.addConstraint(hammerBody, c )
    })


    this.setHammerState(HammerState.rest)
      hammerBody.setCollisionCallbackEnabled(true)
      hammerBody.getCollisionObservable().add((collisionEvent)=>{

      if (collisionEvent.collider._pluginData.entity && collisionEvent.point !== null){
        const player = collisionEvent.collider._pluginData.entity as Player
        if (player){
          player.hammerHit(collisionEvent.point)
        }
      }

    })
    this.hammerBody = hammerBody
  }
  hammerHit(point: Vector3){
    if ( this.primed && this.hammerState === HammerState.swing){
      //make a big bang
      //console.log(`bang`)
      this.primed = false
      this.owner.makeNuke(point, 15, 2000)

    }
  }


  setHammerState(state:HammerState){
    this.hammerState = state
    this.contraints.forEach((c,i)=>{c.isEnabled = (i===state) })
    if (state == HammerState.swing){      
      const force = new Vector3(0,200,0)
      const rotationMat = this.hammerBody.transformNode.getWorldMatrix().getRotationMatrix()
      const transformedForce = Vector4.TransformCoordinates(force, rotationMat).toVector3()

      //swing that badboy!
      this.hammerBody.applyImpulse(transformedForce, new Vector3(0,4,0))
    }
  }
  
  update(dT: number): void {
    this.aliveTime+=dT
    const amp =1200
    const force = new Vector3(amp * this.input.move.x,0,amp* this.input.move.y)
    const point = this.forcePoint.getAbsolutePosition()
    this.body.applyForce(force, point)

    switch(this.hammerState){
      case HammerState.rest:
        if (this.input.fire){
          this.setHammerState(HammerState.draw)
          this.drawTime = 0;
        }
        break
    
      case HammerState.draw:
        if (!this.input.fire){
          this.setHammerState(HammerState.swing)
          this.swingTime = 0
          this.primed = true
        }
        else{
          this.drawTime += dT
        }
        break
      case HammerState.swing:
        this.swingTime += dT
        if (this.swingTime > 600)        {
          this.primed = false
          this.setHammerState(HammerState.rest)
        }
        break
    }

    //reduce jump timeout
    this.jumpTimeout -= dT
    
    if (this.input.jump && this.jumpTimeout <= 0){
      
      const start = this.body.transformNode.getAbsolutePosition()
      const end = start.clone().addInPlaceFromFloats(0,-3,0)
      const castRes = this.owner.raycast(start,end)

      if (castRes.hasHit && castRes.body!= this.hammerBody){
        //check on ground
        this.jumpTimeout = 300
        this.body.applyImpulse(new Vector3(0,700,0), this.body.transformNode.getAbsolutePosition())
      }
      castRes.reset()
    }
/*
    if (this.showForcePointer){
      this.forcePointer.set(point,force)
    }
*/
  }
  
  dispose(): void {
    this.meshes.forEach(m=>{m.dispose()})
    this.hammerBody.dispose()
    super.dispose()
    
  }

}