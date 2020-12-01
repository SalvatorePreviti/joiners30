import { objectValues } from '../core/objects'
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

const ANIMATIONS = {}

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
