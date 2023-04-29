import { GamepadManager, GenericPad } from "@babylonjs/core/Gamepads";
import { IGame, IInputManager } from "./interfaces";
import { Vector2 } from "@babylonjs/core/Maths/math";


export class InputManager implements IInputManager {
  gpm: GamepadManager;

  public move = new Vector2(0, 0);
  public fire = false;

  //sourceMan: DeviceSourceManager
  public constructor(owner: IGame) {
    //joypad
    this.gpm = new GamepadManager(owner.scene);
    this.gpm.onGamepadConnectedObservable.add((gp, state) => {
      
      
      console.log("Gamepad connected")

      const gamepad = gp as GenericPad;
      gamepad.onButtonDownObservable.add((button, state) => { this.fire = true; console.log("fire"); });
      gamepad.onButtonUpObservable.add((button, state) => { this.fire = false; console.log("no fire"); });

      gamepad.onleftstickchanged((values) => {
        this.move.set(values.x, values.y);


        console.log(`joystick move ${values}`); 
      });
    });







  }

}
