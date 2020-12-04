import { Vec3 } from './math/vec3'
import { floor, random } from './math/scalar'
import { showBio, updateDisks } from './page'

export interface GameObject {
  _location: Vec3
  _visible?: boolean
  _lookAtDistance: number
  _onInteract?: () => void //perform action when ACTION key is pressed while looking at
  _onLookAt?: () => string | void //return a string to display, or perform action
}

export const GAME_STATE = {
  _gameEnded: false,
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

function newFloppy(x: number, y: number, z: number, _lookAtDistance = 1.5) {
  return {
    _bioId: 0,
    _location: { x, y, z },
    _visible: true,
    _lookAtDistance,
    _onLookAt: () => 'Pick up the floppy [press E or Space]',
    _onInteract() {
      this._visible = false
      ++GAME_STATE._foundCount
      showBio(this._bioId)
      updateDisks()
    }
  }
}

function shuffleFloppiesBioIds() {
  const floppies = GAME_STATE._floppies
  for (let i = 0; i < floppies.length; ++i) {
    floppies[i]._bioId = i
  }
  for (let i = floppies.length - 1; i > 0; i--) {
    const j = floor(random() * (i + 1))
    const temp = floppies[i]._bioId
    floppies[i]._bioId = floppies[j]._bioId
    floppies[j]._bioId = temp
  }
}

shuffleFloppiesBioIds()
