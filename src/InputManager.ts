
import "@babylonjs/core/Gamepads/gamepadSceneComponent";
import { GamepadManager, Xbox360Pad } from "@babylonjs/core/Gamepads";
import { IGame, IInputManager } from "./interfaces";
import { Vector2 } from "@babylonjs/core/Maths/math";

export class InputManager implements IInputManager {
  gpm: GamepadManager
  move = new  Vector2(0,0)
  keyMove = new  Vector2(0,0)
  fire:boolean = false
  jump:boolean = false
  downKeys = new Set<string>()

  public toggleDebug?:()=>void
  public togggleCamera?: () => void;


  public constructor(owner: IGame) {
    //joypad
    this.gpm = new GamepadManager(owner.scene);
    this.gpm.onGamepadConnectedObservable.add((gp, state) => {
      console.log(`gamepad connected ${gp.id}`)
      if (gp instanceof Xbox360Pad){
        const xpad = gp as Xbox360Pad
        xpad.onleftstickchanged((values)=>{ 
          console.log(`gamepad lstick move ${values.x}, ${values.y}`)
          this.move.set( values.x, values.y )
        })
        xpad.onbuttondown((button)=>{
          console.log(`gamepad button ${button}`)
        })
      }
    })

    this.gpm.onGamepadDisconnectedObservable.add((gp, state)=>{
      console.log(`gamepad disconnected ${gp.id}`)
    })
    if (document){
      document.addEventListener("keydown", (e:KeyboardEvent) =>{  
        if (!e.repeat) { 
          if (this.keyDown(e.key)){
            e.preventDefault()
            e.stopImmediatePropagation()
          }
        }

      })
      document.addEventListener("keyup", (e:KeyboardEvent) =>{ 
        this.keyUp(e.key)

      })
    }
  }

  keyDown(key: string):boolean {
    if (this.downKeys.has(key)){
      return false
    }
    this.downKeys.add(key)
    console.log(`keydown ${key}`)
    switch(key){
      case "ArrowUp":
      case "w": 
        this.keyMove.y+=1 
        break
      case "ArrowDown":
      case "s": 
        this.keyMove.y-=1 
        break
      case "ArrowRight":
      case "d": 
        this.keyMove.x-=1 
        break
      case "ArrowLeft":
      case "a":
        this.keyMove.x+=1 
        break
      case " ":
        this.jump = true
        this.fire = true
        break
      case "Shift":
        this.fire = true
        break

      case "F2":
        if (this.toggleDebug){
          this.toggleDebug()
        }
        break

      case "F4":
        if (this.togggleCamera){
          this.togggleCamera()
        }  
        break;
      default: 
        return false
    }


    this.updateMove()
    return true
  }  
  
  keyUp(key: string):void {
    if (!this.downKeys.has(key)){
      return
    }
    this.downKeys.delete(key)
    //console.log(`keyup ${key}`)
    switch(key){
      
      case "ArrowUp":
      case "w": 
        this.keyMove.y-=1 
        break
      case "ArrowDown":
      case "s": 
        this.keyMove.y+=1 
        break
      case "ArrowRight":
      case "d": 
        this.keyMove.x+=1 
        break
      case "ArrowLeft":
      case "a":
        this.keyMove.x-=1 
        break
      case " ":
        this.jump = false
        this.fire = false
        break
      case "Shift":
        this.fire = false
        break
      
    }
    this.updateMove()
  }

  updateMove():void {
    this.move.copyFrom(this.keyMove)
    this.move.normalize()
    //console.log(`keys ${this.keyMove.x}, ${this.keyMove.y}  move ${this.move.x}, ${this.move.y}`)
  }
}
