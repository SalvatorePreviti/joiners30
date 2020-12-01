import { vec3Distance, vec3Direction, vec3Temp0, vec3Dot, Vec3 } from '../math/vec3'
import { cameraPos, cameraDir } from '../camera'
import { setText } from '../text'
import { KEY_ACTION, PressedKeys } from '../keyboard'
import { objectValues } from '../core/objects'

interface GameObject {
  _location: Vec3
  _visible?: boolean
  _lookAtDistance: number
  _onInteract: () => void //perform action when ACTION key is pressed while looking at
  _onLookAt: () => string | void //return a string to display, or perform action
}

const INVENTORY = {
  _key: false,
  _antennaKey: false,
  _floppy: false
}

const GAME_OBJECTS = {}

const GAME_STATE = {
  _gameEnded: false,
  _objects: GAME_OBJECTS
}

const GAME_OBJECTS_LIST: GameObject[] = objectValues(GAME_STATE._objects)

const getVisibleObject = (): GameObject => {
  for (const gameObject of GAME_OBJECTS_LIST) {
    if (gameObject._visible) {
      const objectLocation = gameObject._location
      if (vec3Distance(objectLocation, cameraPos) <= gameObject._lookAtDistance) {
        if (vec3Dot(cameraDir, vec3Direction(vec3Temp0, cameraPos, objectLocation)) > 0.9) {
          return gameObject
        }
      }
    }
  }
  return undefined
}

const updateGameObjects = () => {
  const visibleObject = getVisibleObject()
  setText((visibleObject && visibleObject._onLookAt()) || '')
  if (visibleObject && PressedKeys[KEY_ACTION]) {
    visibleObject._onInteract()
  }
}

export { GAME_STATE, INVENTORY, updateGameObjects }
