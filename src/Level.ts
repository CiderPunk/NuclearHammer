import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { IGame, IKid, ILevel } from "./interfaces";
import { Node } from "@babylonjs/core/node";
import { PhysicsAggregate, PhysicsShapeBox, PhysicsShapeConvexHull, PhysicsShapeType } from "@babylonjs/core/Physics";
import { IDisposable } from "@babylonjs/core/scene";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { AbstractMesh } from "@babylonjs/core/Meshes";
import { Light } from "@babylonjs/core/Lights/light";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CollisionMask } from "./constants";
import { Kid } from "./entities/kid";

export class Level implements ILevel, IDisposable{
  loadedRoot?: Node;
  readonly aggregates = new Array<PhysicsAggregate>()
  readonly shadowReceivers = new Array<AbstractMesh>()
  shadowGenerator?: ShadowGenerator;
  light?: DirectionalLight;
  goalCount: number;

  public constructor(readonly owner:IGame, level:string, readonly enableShadows:boolean){
    
    this.goalCount = 0

    SceneLoader.Append("maps/", level, owner.scene, (scene)=>{ 
      this.loadedRoot = scene.rootNodes.find(n=>n.id == "__root__")
      if (!this.loadedRoot){
        throw new Error("Root node not found")
      }

      //create hull aggregates
      const hullRoot = this.loadedRoot.getChildren().find(n=>n.id==="hull")
      if (!hullRoot){
        throw new Error("No hull node found")
      }
      hullRoot.getChildMeshes().forEach((mesh)=>{
        if (mesh.name.indexOf("slope") > -1){
          this.aggregates.push(new PhysicsAggregate(mesh, PhysicsShapeType.MESH, { mass:0}, scene))
        }
        else{
          this.aggregates.push(new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass:0}, scene))
        }
      })
      //hide hull geometry
      hullRoot.setEnabled(false)

      //creat goal aggregate...?
      const goalRoot = this.loadedRoot.getChildren().find(n=>n.id==="goal")
      if (!goalRoot){
        throw new Error("No goal node found")
      }
      goalRoot.getChildMeshes().forEach((mesh)=>{
        const goal = new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass:0, }, scene)
        this.aggregates.push(goal)
        goal.shape.filterMembershipMask = CollisionMask.Goal
        goal.body._pluginData.level = this

        if (mesh.name.indexOf("goal") > -1){
          goal.shape.filterCollideMask = CollisionMask.Kid

          goal.body.setCollisionCallbackEnabled(true)
          goal.body.getCollisionObservable().add((collisionEvent)=>{
            if (!collisionEvent.collidedAgainst._pluginData){ return }
            const level = collisionEvent.collider._pluginData.level as Level
            const kid =  collisionEvent.collidedAgainst._pluginData.entity as IKid
            if (level && kid){
              level.goalHit(kid)
            }
          })
        }
        if (mesh.name.indexOf("block") > -1){
          goal.shape.filterCollideMask = CollisionMask.Player
        }
   
      })
      //hide goal geometry
      goalRoot.setEnabled(false)


      this.loadedRoot.getDescendants().forEach(n=>{
        const absMesh = n  as AbstractMesh

        if (enableShadows &&  absMesh){
          if (n.name.indexOf("ground") > -1){
            absMesh.receiveShadows = true
          }
        }
        if (n instanceof DirectionalLight){
        
          if (n.intensity > 1){ n.intensity = 1}
          if (n.name.indexOf("sun") > -1){
            this.light = n
          }
        }

        if (n.name.indexOf("SPINNER") > -1 && absMesh){


          this.owner.spawnSpinner(absMesh.getAbsolutePosition())

        }
      })

      if (enableShadows && this.light){
        this.shadowGenerator = new ShadowGenerator(1024, this.light);
      }

      owner.startGame()
    })
  }
  goalHit(kid: IKid) {
    if (kid.active){
      kid.reachedGoal()
      this.goalCount++
      //console.log(`goal: ${this.goalCount}`)
      this.owner.goalHit()
    }
  }


  addShadowCaster(mesh:AbstractMesh){
    if (this.enableShadows){
      this.shadowGenerator?.addShadowCaster(mesh, true)
    }
  }

  dispose(): void {
    this.aggregates.forEach(a=>a.dispose())
    this.loadedRoot?.dispose()
  }





}