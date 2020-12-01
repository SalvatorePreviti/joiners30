import { vec3Distance, vec3Direction, vec3Temp0, vec3Dot, Vec3, vec3Set } from '../math/vec3'
import { cameraPos, cameraDir, cameraEuler } from '../camera'
import { setText } from '../text'
import { KEY_ACTION, PressedKeys } from '../keyboard'
import { vec2Set } from '../math/vec2'
import { DEG_TO_RAD } from '../math/scalar'
import { bioHtmlVisible } from '../page'

interface GameObject {
  _location: Vec3
  _visible?: boolean
  _lookAtDistance: number
  _onInteract?: () => void //perform action when ACTION key is pressed while looking at
  _onLookAt?: () => string | void //return a string to display, or perform action
}

const GAME_STATE = {
  _gameEnded: false,
  _bioVisible: -1,
  _foundCount: 0,
  _floppies: [newFloppy(-46.5, 1.01, -25)]
}

function newFloppy(x: number, y: number, z: number, _lookAtDistance = 4): GameObject {
  return {
    _location: { x, y, z },
    _visible: true,
    _lookAtDistance,
    _onLookAt: () => 'Pick up the floppy [press E or Space]',
    _onInteract() {
      this._visible = false
      ++GAME_STATE._foundCount
      GAME_STATE._bioVisible = GAME_STATE._floppies.indexOf(this)
    }
  }
}

const getVisibleObject = (): GameObject => {
  const floppies = GAME_STATE._floppies
  for (let i = 0; i < floppies.length; ++i) {
    const floppy = floppies[i]
    if (floppy._visible) {
      const objectLocation = floppy._location
      console.log(vec3Distance(objectLocation, cameraPos))
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
  vec3Set(cameraPos, 5.844, 14.742, 4)
  vec2Set(cameraEuler, -90 * DEG_TO_RAD, 17 * DEG_TO_RAD)
}

const updateGameObjects = () => {
  if (!bioHtmlVisible && !GAME_STATE._gameEnded && GAME_STATE._foundCount >= GAME_STATE._floppies.length) {
    endGame()
  } else {
    const visibleObject = getVisibleObject()
    setText((visibleObject && visibleObject._onLookAt && visibleObject._onLookAt()) || '')
    if (visibleObject && PressedKeys[KEY_ACTION] && visibleObject._onInteract) {
      visibleObject._onInteract()
    }
  }
}

export { GAME_STATE, updateGameObjects }
