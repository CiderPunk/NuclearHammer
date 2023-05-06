
//import "@babylonjs/core/Gamepads/gamepadSceneComponent";
import { GamepadManager, Xbox360Pad,Xbox360Button, DualShockPad, DualShockButton, GenericPad  } from "@babylonjs/core/Gamepads";
import { IGame, IInputManager } from "./interfaces";
import { Vector2 } from "@babylonjs/core/Maths/math";


export class InputManager implements IInputManager {
  //gpm: GamepadManager
  move = new  Vector2(0,0)
  keyMove = new  Vector2(0,0)
  fire:boolean = false
  jump:boolean = false
  downKeys = new Set<string>()

  public toggleDebug?:()=>void
  public togggleCamera?: () => void;
  public nextLevel?: () => void;
  public constructor(owner: IGame) {
    
  //joypad
  const gpm = new GamepadManager();
  gpm.onGamepadConnectedObservable.add((gamepad, state) => {
   console.log(`gamepad connected ${gamepad.id}`)

    //Stick events
    gamepad.onleftstickchanged((values)=>{
      //console.log(`Left gamepad x:${values.x} y:${values.y}`)
      this.move.set(-values.x, -values.y)
      if (this.move.lengthSquared() > 1){
        this.move.normalize()
      }
    })

    //Handle gamepad types
    if (gamepad instanceof Xbox360Pad) {
      //Xbox button down/up events
      gamepad.onButtonDownObservable.add((button, state)=>{
        switch ( button){
          case Xbox360Button.B:
            this.jump = true
            this.fire = true
            break;
          case Xbox360Button.A:
            this.fire = true
            break;
          case Xbox360Button.Start:
            if (this.nextLevel){
              this.nextLevel()
            }  
            break;
        }
      })
      gamepad.onButtonUpObservable.add((button, state)=>{
        switch (button){
          case Xbox360Button.B:
            this.jump = false
            this.fire = false
            break;
          case Xbox360Button.A:
            this.fire = false
            break;
        }
      })
    } 
    else if (gamepad instanceof DualShockPad) {
     //Dual shock button down/up events
      gamepad.onButtonDownObservable.add((button, state)=>{
        switch (button){
          case DualShockButton.Circle:
            this.jump = true
            this.fire = true
            break;
          case DualShockButton.Cross:
            this.fire = true
            break;

          case DualShockButton.Options:
            if (this.nextLevel){
              this.nextLevel()
            }  
            break;

        }
      })
     gamepad.onButtonUpObservable.add((button, state)=>{
      switch (button){
        case DualShockButton.Circle:
          this.jump = false
          this.fire = false
          break;
        case DualShockButton.Cross:
          this.fire = false
          break;
      }
     })
   }
   else if (gamepad instanceof GenericPad) {

     gamepad.onButtonDownObservable.add((button, state)=>{
      switch (button){
        case 0:
          this.jump = true
          this.fire = true
          break;
        case 1:
          this.fire = true
          break;

        case 3:
          if (this.nextLevel){
            this.nextLevel()
          }  
          break;

      }
     })
     gamepad.onButtonUpObservable.add((button, state)=>{
      switch (button){
        case 0:
          this.jump = false
          this.fire = false
          break;
        case 1:
          this.fire = false
          break;
      }
     })
   } 

 })

 gpm.onGamepadDisconnectedObservable.add((gp, state)=>{
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
    //console.log(`keydown ${key}`)
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
        //this.fire = true
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

        case "Enter":
          if (this.nextLevel){
            this.nextLevel()
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
