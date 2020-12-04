import { vec3Distance, vec3Direction, vec3Temp0, vec3Dot } from './math/vec3'
import { cameraPos, cameraDir } from './camera'
import { setText } from './text'
import { bioHtmlVisibleId, updateDisks } from './page'
import { GameObject, GAME_STATE } from './game-state'

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

export const updateGameObjects = () => {
  if (GAME_STATE._foundCount >= GAME_STATE._floppies.length) {
    if (bioHtmlVisibleId < 0 && !GAME_STATE._gameEnded) {
      GAME_STATE._gameEnded = true
      setText('')
      updateDisks()
    }
  } else if (!GAME_STATE._gameEnded) {
    const visibleObject = getVisibleObject()
    setText((visibleObject && visibleObject._onLookAt && visibleObject._onLookAt()) || '')
  }
}

export const gameObjectsAction = () => {
  if (!GAME_STATE._gameEnded) {
    const visibleObject = getVisibleObject()
    if (visibleObject && visibleObject._onInteract) {
      visibleObject._onInteract()
    }
  }
}
