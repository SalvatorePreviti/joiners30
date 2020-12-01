import { objectValues } from '../core/objects'
import { GAME_OBJECTS } from './objects'
import { vec3New } from '../math/vec3'
import { MINIGAME, MINIGAME_ACTIVE } from './minigame'
import { gameTimeDelta } from '../time'

interface Animation {
  _value: number
  _speed: number
  _initial: number
  _max: number
  _running: number
  _onComplete?: Function
  _rumble?: (animValue: number) => boolean //function that is passed the value and returns true/false whether it should be rumbling
}

const ANIMATIONS = {
  _prisonDoor: {
    _value: 0,
    _speed: 1.1,
    _initial: 0,
    _max: 1,
    _running: 0
  },
  _antennaDoor: {
    _value: 0,
    _speed: 0.2,
    _initial: 0,
    _max: 1,
    _running: 0
  },
  _monumentDescend: {
    _value: 0,
    _speed: 0.3,
    _initial: 0,
    _max: 1,
    _running: 0,
    _onComplete() {
      //Set the key location so it can be picked up:
      GAME_OBJECTS._antennaKey._location = vec3New(46.4, 4.6, 29.4)
    },
    _rumble: () => true
  },
  _oilrigRamp: {
    _value: 0,
    _speed: 1.2,
    _initial: 0,
    _max: 19,
    _running: 0,
    _rumble: (v: number) => v < 0.5 || v > 18.8
  },
  _oilrigWheel: {
    _value: 0,
    _speed: 3,
    _initial: 0,
    _max: 10,
    _running: 0,
    _onComplete() {
      runAnimation(ANIMATIONS._antennaRotation)
    }
  },
  _antennaRotation: {
    _value: 0,
    _speed: 0.5,
    _initial: 0,
    _max: 1000000000, //never end
    _running: 0
  },
  _elevatorHeight: {
    _value: 1, //top
    _initial: -19.2,
    _max: 1,
    _speed: 4,
    _running: 0,
    _rumble: (v: number) => v < -19 || v > 0.8
  },
  _afterFloppyInsert: {
    _value: 0,
    _initial: 0,
    _max: 1,
    _speed: 1,
    _running: 0,
    _onComplete() {
      MINIGAME._state = MINIGAME_ACTIVE
    }
  },
  _submarine: {
    _value: -10,
    _initial: -10,
    _max: 4,
    _speed: 1,
    _running: 0
  },
  _oilrigRamp2: {
    _value: 0,
    _initial: 0,
    _max: 1,
    _speed: 1,
    _running: 0
  }
}

const ANIMATIONS_LIST: Animation[] = objectValues(ANIMATIONS)
let RUMBLING: boolean = false

function updateAnimations() {
  RUMBLING = false
  for (const anim of ANIMATIONS_LIST) {
    if (anim._running) {
      if (anim._rumble) {
        RUMBLING = anim._rumble(anim._value)
      }
      anim._value += anim._speed * gameTimeDelta * anim._running
      if (anim._value > anim._max || anim._value < anim._initial) {
        anim._value = anim._running > 0 ? anim._max : anim._initial
        if (anim._onComplete) {
          anim._onComplete()
        }
        anim._running = 0
      }
    }
  }
}

function runAnimation(anim: Animation, direction = 1) {
  anim._value = direction > 0 ? anim._initial : anim._max
  anim._running = direction
}

export { ANIMATIONS, RUMBLING, runAnimation, updateAnimations }
