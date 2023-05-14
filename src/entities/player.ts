import { Color3, Vector2, Vector3, Vector4 } from "@babylonjs/core/Maths/math";
import { IGame, IInputManager } from "../interfaces";
import { Person } from "./person";
import { AbstractMesh, CreateCylinder, TransformNode } from "@babylonjs/core/Meshes";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Physics6DoFConstraint, PhysicsBody,  PhysicsConstraintAxis, PhysicsMotionType, PhysicsShapeCylinder } from "@babylonjs/core/Physics";
import { CollisionMask } from "../constants";
import { Pointer } from "../helpers/pointer";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Sound } from "@babylonjs/core/Audio";


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
  jumpPoint: TransformNode;

  pointers = new Array<Pointer>()
  static readonly splosions = new Array<Sound>()


  public static async preload(assMan:AssetsManager, game:IGame){
    for (let i = 1; i<=3; i++){
      assMan.addBinaryFileTask(`explosion${i}`, `assets/explosion${i}.wav`)
      .onSuccess = (task)=>{
        const sound = new Sound(`splosion${i}`, task.data, game.scene,  ()=>{ Player.splosions.push(sound)} )
      }
    }
  }




  public constructor(name:string, owner:IGame, readonly input:IInputManager){

    super(name, owner, { radiusTop:1, radiusBottom:1.6, height:5, capsuleBottom:-1.2, canterOfGravity:-3,forceVerticalOffset:-3, forceTurningOffset:-0.4, showForce:false, mass:60, createMat:true, friction:0.7  })

    
    this.pointers.push(new Pointer("parralel", owner.scene, Color3.Blue(), 0))
    this.pointers.push(new Pointer("perp", owner.scene, Color3.Red(),0))


    this.shape.filterMembershipMask = CollisionMask.Player
    this.shape.filterCollideMask = CollisionMask.Kid | CollisionMask.Goal

    this.rootMesh.scaling.set(1.2,1.2,1.2)

    //responsive controls
     this.body.setLinearDamping(1.25)

     //this.body.setAngularDamping(2)
    
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
        { axis: PhysicsConstraintAxis.ANGULAR_X,minLimit:Math.PI * -0.3 ,maxLimit:Math.PI * 2     },
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
    this.jumpPoint = new TransformNode(`${this.name}_jump`, this.owner.scene)
    this.jumpPoint.setAbsolutePosition(new Vector3(0,2,0))
    this.jumpPoint.setParent(this.rootMesh)
  }



  hammerHit(point: Vector3){

    if ( this.primed && this.hammerState === HammerState.swing){
      //make a big bang
      if (Player.splosions.length > 0){
        Player.splosions[Math.floor(Math.random() * Player.splosions.length)].play()
      }
  
      //console.log(`bang`)
      this.primed = false
      this.owner.makeNuke(point,18,4000)

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
  
  static rayStart = new Vector3()
  static rayEnd = new Vector3()

  update(dT: number): void {
    this.aliveTime+=dT

    const start = this.body.transformNode.getAbsolutePosition()
    Player.rayEnd.copyFrom(this.body.transformNode.absolutePosition).addInPlaceFromFloats(0,-4      ,0)
    Player.rayStart.copyFrom(this.body.transformNode.absolutePosition)

    const castRes = this.owner.raycast(Player.rayStart, Player.rayEnd)
    const onGround = castRes.hasHit && castRes.body!= this.hammerBody
    castRes.reset()

    const amp = onGround ? 1200 :400 
    const force = new Vector3(this.input.move.x * amp, 0, this.input.move.y * amp)
    const pos = this.forcePoint.getAbsolutePosition()
    this.body.applyForce(force, pos)
    

    /*
    const targetSpeed = 20
    //target velocity
    const targetV2 = this.input.move.scale(targetSpeed)
    const targetSquared = targetV2.lengthSquared()

    //current 
    const currentV3 = new Vector3()
    this.body.getLinearVelocityToRef(currentV3)

    //difference
    const diff = targetV2.subtract( new Vector2(currentV3.x, currentV3.z))
    if (diff.lengthSquared() > 1){
      diff.normalize()
    }

    //max force 
    const amp = 2000
    const forceV2 = new Vector2(diff.x * amp, diff.y * amp)
  
    if (targetSquared >0){

      const dotProd = Vector2.Dot(forceV2, targetV2)
      const forceParallel = targetV2.scale(dotProd / targetSquared)
      const forcePerp = forceV2.subtract(forceParallel)

      const f1 = new Vector3(forceParallel.x,0,forceParallel.y)
      const pos1 = this.forcePoint.getAbsolutePosition()
      this.body.applyForce(f1, pos1)
      
      const f2 = new Vector3(forcePerp.x,0,forcePerp.y)
      const pos2 = this.cogPoint.getAbsolutePosition()
      this.body.applyForce(f2, pos2)
      this.pointers[0].setVisible(true)
      this.pointers[0].set(pos1,f1)
      this.pointers[1].set(pos2,f2)
    }
    else{
      const f2 = new Vector3(forceV2.x,0,forceV2.y)
      const pos2 = this.cogPoint.getAbsolutePosition()
      this.body.applyForce(f2, pos2)
      this.pointers[0].setVisible(false)
      this.pointers[1].set(pos2,f2)
    }

/*
    console.log(`target: ${targetV2}
current: ${currentV3}
diff: ${diff}
force:${forceV2}
forceParrallel:${forceParallel}
forcePerp:${forcePerp}`)
*/


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
    
    if (this.input.jump && this.jumpTimeout <= 0 && onGround){
      //check on ground
      this.jumpTimeout = 300
      this.body.applyImpulse(new Vector3(0,1000,0), this.jumpPoint.getAbsolutePosition())

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