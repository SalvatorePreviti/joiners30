import { debug_mode } from './debug'
import { loadBio, mainMenuVisible } from './page'

export const KEY_FORWARD = 1

export const KEY_BACKWARD = 2

export const KEY_STRAFE_LEFT = 3

export const KEY_STRAFE_RIGHT = 4

export const KEY_LOOK_UP = 5

export const KEY_LOOK_DOWN = 6

export const KEY_LOOK_LEFT = 7

export const KEY_LOOK_RIGHT = 8

export const KEY_RUN = 9

export const KEY_ACTION = 10

export const KEY_MAIN_MENU = 11

export const KEY_FLY_UP = 12

export const KEY_FLY_DOWN = 13

/* List of pressed keys */
export const PressedKeys: boolean[] = []

export const KeyFunctions: Record<number, (repeat?: boolean) => void> = {}

const _keyMap: Record<string, number> = {
  ArrowUp: KEY_LOOK_UP,
  ArrowDown: KEY_LOOK_DOWN,
  ArrowLeft: KEY_LOOK_LEFT,
  ArrowRight: KEY_LOOK_RIGHT,

  w: KEY_FORWARD,
  W: KEY_FORWARD,
  z: KEY_FORWARD,
  Z: KEY_FORWARD,

  s: KEY_BACKWARD,
  S: KEY_BACKWARD,

  a: KEY_STRAFE_LEFT,
  A: KEY_STRAFE_LEFT,
  q: KEY_STRAFE_LEFT,
  Q: KEY_STRAFE_LEFT,

  d: KEY_STRAFE_RIGHT,
  D: KEY_STRAFE_RIGHT,

  Shift: KEY_RUN,

  e: KEY_ACTION,
  E: KEY_ACTION,
  Enter: KEY_ACTION,
  ' ': KEY_ACTION,

  Escape: KEY_MAIN_MENU,
  X: KEY_MAIN_MENU,
  x: KEY_MAIN_MENU
}

if (debug_mode) {
  Object.assign(_keyMap, {
    g: KEY_FLY_DOWN,
    G: KEY_FLY_DOWN,
    '-': KEY_FLY_DOWN,

    r: KEY_FLY_UP,
    R: KEY_FLY_UP,
    '+': KEY_FLY_UP
  })
}

const _setKeyPressed = (e: KeyboardEvent, value: boolean) => {
  const key = e.key
  if (!e.keyCode || e.metaKey || !document.activeElement || mainMenuVisible) {
    PressedKeys.length = 0 // Clear pressed status to prevent key sticking when alt+tabbing or showing the menu
    if ((mainMenuVisible && _keyMap[key] === KEY_MAIN_MENU) || _keyMap[key] === KEY_ACTION) {
      loadBio(-1)
    }
  } else {
    const keyId = _keyMap[key] | 0
    if (value && KeyFunctions[keyId]) {
      KeyFunctions[keyId](e.repeat)
    }
    PressedKeys[keyId] = value
  }
}

onkeydown = (ev) => _setKeyPressed(ev, true)
onkeyup = (ev) => _setKeyPressed(ev, false)
