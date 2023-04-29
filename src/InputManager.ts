
import "@babylonjs/core/Gamepads/gamepadSceneComponent";
import { GamepadManager, Xbox360Pad } from "@babylonjs/core/Gamepads";
import { IGame, IInputManager } from "./interfaces";
import { Vector2 } from "@babylonjs/core/Maths/math";

export class InputManager implements IInputManager {
  gpm: GamepadManager

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
  }

  move = new  Vector2(0,0)
  fire:boolean = false
}
