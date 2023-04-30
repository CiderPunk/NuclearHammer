import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { IGame, ILevel } from "./interfaces";
import { Node } from "@babylonjs/core/node";
import { PhysicsAggregate, PhysicsShapeBox, PhysicsShapeConvexHull, PhysicsShapeType } from "@babylonjs/core/Physics";
import { IDisposable } from "@babylonjs/core/scene";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { AbstractMesh } from "@babylonjs/core/Meshes";
import { Light } from "@babylonjs/core/Lights/light";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

export class Level implements ILevel, IDisposable{
  loadedRoot?: Node;
  readonly aggregates = new Array<PhysicsAggregate>()
  readonly shadowReceivers = new Array<AbstractMesh>()
  shadowGenerator?: ShadowGenerator;
  light?: DirectionalLight;



  public constructor(owner:IGame, level:string, readonly enableShadows:boolean){
    SceneLoader.Append("maps/", level, owner.scene, (scene)=>{ 
      this.loadedRoot = scene.rootNodes.find(n=>n.id == "__root__")
      if (!this.loadedRoot){
        throw new Error("Root node not found")
      }
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

      const goalRoot = this.loadedRoot.getChildren().find(n=>n.id==="goal")
      if (!hullRoot){
        throw new Error("No goal node found")
      }
      hullRoot.getChildMeshes().forEach((mesh)=>{
        const goal = new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass:0, }, scene)



          this.aggregates.push()
    
      })





      this.loadedRoot.getDescendants().forEach(n=>{
        if (enableShadows &&  n instanceof AbstractMesh){
          if (n.name.indexOf("ground") > -1){
            n.receiveShadows = true
          }
        }
        if (n instanceof DirectionalLight){
          
          if (n.intensity > 1){ n.intensity = 1}
          if (n.name.indexOf("sun") > -1){
            this.light = n
          }
          
          //this.light = new DirectionalLight("dir", Vector3.Down(), scene)
          //this.light.position = n.getAbsolutePosition()
          //n.dispose()
        }
      })

      if (enableShadows && this.light){
        this.shadowGenerator = new ShadowGenerator(1024, this.light);
      }
      hullRoot.setEnabled(false)
      owner.startGame()
    })
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