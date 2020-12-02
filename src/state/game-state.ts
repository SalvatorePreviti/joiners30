import { vec3Distance, vec3Direction, vec3Temp0, vec3Dot, Vec3, vec3Set } from '../math/vec3'
import { cameraPos, cameraDir, cameraEuler } from '../camera'
import { setText } from '../text'
import { KEY_ACTION, PressedKeys } from '../keyboard'
import { vec2Set } from '../math/vec2'
import { cos, DEG_TO_RAD, PI, sin } from '../math/scalar'
import { bioHtmlVisible } from '../page'
import { gameTime } from '../time'

interface GameObject {
  _location: Vec3
  _visible?: boolean
  _lookAtDistance: number
  _onInteract?: () => void //perform action when ACTION key is pressed while looking at
  _onLookAt?: () => string | void //return a string to display, or perform action
}

const GAME_STATE = {
  _gameEnded: false,
  _bioIndex: -1,
  _foundCount: 0,
  _floppies: [
    newFloppy(18.33, 1.9562, 22.34),
    newFloppy(25.7, 1.9562, 22.5),
    newFloppy(36, 5.361, -12.6),
    newFloppy(47.1, 2.407, 0.14),
    newFloppy(-41.5, 2.805, 2.1),
    newFloppy(-47.8, 2.64, 13.6),
    newFloppy(-11.3, 6.308, -16.1),
    newFloppy(7.7, 12.2, 0.44),
    newFloppy(1.5, 15.805, -0.95)
  ]
}

function newFloppy(x: number, y: number, z: number, _lookAtDistance = 1.2): GameObject {
  return {
    _location: { x, y, z },
    _visible: true,
    _lookAtDistance,
    _onLookAt: () => 'Pick up the floppy [press E or Space]',
    _onInteract() {
      this._visible = false
      ++GAME_STATE._foundCount
      GAME_STATE._bioIndex = GAME_STATE._floppies.indexOf(this)
    }
  }
}

const getVisibleObject = (): GameObject => {
  const floppies = GAME_STATE._floppies
  for (let i = 0; i < floppies.length; ++i) {
    const floppy = floppies[i]
    if (floppy._visible) {
      const objectLocation = floppy._location
      if (vec3Distance(objectLocation, cameraPos) <= floppy._lookAtDistance) {
        if (vec3Dot(cameraDir, vec3Direction(vec3Temp0, cameraPos, objectLocation)) > 0.9) {
          return floppy
        }
      }
    }
  }
  return undefined
}

const endGame = () => {
  GAME_STATE._gameEnded = true
  const t = gameTime * 0.2
  const s = sin(gameTime * 0.4) * 9
  vec3Set(cameraPos, sin(t) * 80 + s, 38, cos(t) * 40 + s)
  vec2Set(cameraEuler, t + PI, 23 * DEG_TO_RAD + cos(gameTime * 0.5) * 0.05)
  setText('')
}

let _actionWasPressed = false

const updateGameObjects = () => {
  if (!bioHtmlVisible) {
    if (GAME_STATE._foundCount >= GAME_STATE._floppies.length) {
      endGame()
    } else {
      const visibleObject = getVisibleObject()
      setText((visibleObject && visibleObject._onLookAt && visibleObject._onLookAt()) || '')
      if (visibleObject && !_actionWasPressed && PressedKeys[KEY_ACTION] && visibleObject._onInteract) {
        visibleObject._onInteract()
      }
    }
  }

  _actionWasPressed = PressedKeys[KEY_ACTION]
}

export { GAME_STATE, updateGameObjects }
