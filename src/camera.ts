import {
  PressedKeys,
  KEY_FORWARD,
  KEY_BACKWARD,
  KEY_STRAFE_LEFT,
  KEY_STRAFE_RIGHT,
  KEY_FLY_UP,
  KEY_FLY_DOWN,
  KEY_RUN,
  KEY_LOOK_UP,
  KEY_LOOK_DOWN,
  KEY_LOOK_LEFT,
  KEY_LOOK_RIGHT
} from './keyboard-state'

import {
  debug_mode,
  debug_updateCameraPosition,
  debug_updateCameraDirection,
  debug_updateCameraEulerAngles
} from './debug'
import { mouseYInversion, headBobEnabled, mouseSensitivity, bioHtmlVisibleId } from './page'
import { canvasElement } from './page-elements'
import { cos, sin, wrapAngleInRadians, clamp, DEG_TO_RAD, lerp, PI } from './math/scalar'
import {
  vec3Temp0,
  vec3Add,
  vec3ScalarMultiply,
  vec3Normalize,
  vec3Cross,
  VEC3_UNIT_Y,
  vec3New,
  vec3NewValue,
  vec3Set,
  vec3Temp1,
  Vec3
} from './math/vec3'
import { Vec2, vec2New, vec2Set } from './math/vec2'
import { typedArraySet } from './core/arrays'
import { GAME_STATE } from './game-state'
import { gameTime, gameTimeDelta } from './time'
import type { Mat3 } from './math/math-types'

const CAMERA_SPEED_DEFAULT = 3

const CAMERA_SPEED_RUN = debug_mode ? 20 : 7

/** head bob value */
export let headBob = 0

/** Camera position */
export const cameraPos: Vec3 = vec3New(103, 44, 9)

/** Camera Yaw (x) and Pitch (y) angles, in radians. */
export const cameraEuler: Vec2 = vec2New(-102 * DEG_TO_RAD, 23 * DEG_TO_RAD)

/** Camera direction, calculated from cameraEulerAngles */
export const cameraDir: Vec3 = vec3NewValue()

/** Camera rotation matrix */
export const cameraMat3: Mat3 = new Float32Array(9)

export const movementForward = (direction: number) =>
  vec3Add(vec3Temp0, vec3ScalarMultiply(vec3Normalize(vec3Set(vec3Temp1, cameraDir.x, 0, cameraDir.z)), direction))

export const movementStrafe = (direction: number) =>
  vec3Add(vec3Temp0, vec3ScalarMultiply(vec3Normalize(vec3Cross(vec3Temp1, cameraDir, VEC3_UNIT_Y)), direction))

export const cameraMoveDown = (amount: number) => {
  cameraPos.y += amount
}

const updateCameraDirFromEulerAngles = () => {
  const { x: yaw, y: pitch } = cameraEuler

  const sinYaw = sin(yaw)
  const cosYaw = cos(yaw)
  const sinPitch = sin(pitch)
  const cosPitch = cos(pitch)

  vec3Normalize(vec3Set(cameraDir, sinYaw * cosPitch, -sinPitch, cosYaw * cosPitch))

  // Update rotation matrix
  typedArraySet(
    cameraMat3,
    cosYaw,
    0,
    -sinYaw,
    sinYaw * sinPitch,
    cosPitch,
    cosYaw * sinPitch,
    sinYaw * cosPitch,
    -sinPitch,
    cosYaw * cosPitch
  )
}

let timeMoving = 0

export const updateCamera = () => {
  const speed = (PressedKeys[KEY_RUN] ? CAMERA_SPEED_RUN : CAMERA_SPEED_DEFAULT) * gameTimeDelta

  if (GAME_STATE._gameEnded) {
    const t = gameTime * 0.2
    const s = sin(gameTime * 0.4) * 9
    vec3Set(cameraPos, sin(t) * 80 + s, 38, cos(t) * 40 + s)
    vec2Set(cameraEuler, t + PI, 23 * DEG_TO_RAD + cos(gameTime * 0.5) * 0.05)
  } else if (bioHtmlVisibleId < 0) {
    vec3Set(vec3Temp0, 0, 0, 0)
    if (PressedKeys[KEY_FORWARD]) {
      movementForward(1)
    }
    if (PressedKeys[KEY_BACKWARD]) {
      movementForward(-1)
    }
    if (PressedKeys[KEY_STRAFE_LEFT]) {
      movementStrafe(-1)
    }
    if (PressedKeys[KEY_STRAFE_RIGHT]) {
      movementStrafe(1)
    }
    if (vec3Temp0.x || vec3Temp0.z) {
      timeMoving += gameTimeDelta
      headBob = headBobEnabled ? sin(timeMoving * 10) * 0.03 : 0
      vec3Add(cameraPos, vec3ScalarMultiply(vec3Normalize(vec3Temp0), speed))
    }

    if (!GAME_STATE._gameEnded) {
      const sensX = PressedKeys[KEY_RUN] ? 0.016 : 0.008
      const sensY = sensX * 0.8
      let lookX = 0
      let lookY = 0
      if (PressedKeys[KEY_LOOK_UP]) {
        lookY -= sensY
      }
      if (PressedKeys[KEY_LOOK_DOWN]) {
        lookY += sensY
      }
      if (PressedKeys[KEY_LOOK_LEFT]) {
        lookX -= sensX
      }
      if (PressedKeys[KEY_LOOK_RIGHT]) {
        lookX += sensX
      }
      if (lookX || lookY) {
        rotateCamera(lookX, lookY)
      }
    }

    if (debug_mode) {
      if (PressedKeys[KEY_FLY_UP]) {
        cameraPos.y += speed
      }
      if (PressedKeys[KEY_FLY_DOWN]) {
        cameraPos.y -= speed
      }
    }
  }

  updateCameraDirFromEulerAngles()

  debug_updateCameraEulerAngles(cameraEuler)
  debug_updateCameraDirection(cameraDir)
}

updateCameraDirFromEulerAngles()

debug_updateCameraPosition(cameraPos)

onmousemove = (e) => {
  if (document.pointerLockElement === canvasElement && !GAME_STATE._gameEnded) {
    if (
      PressedKeys[KEY_LOOK_UP] ||
      PressedKeys[KEY_LOOK_DOWN] ||
      PressedKeys[KEY_LOOK_LEFT] ||
      PressedKeys[KEY_LOOK_RIGHT]
    ) {
      return
    }

    const sens = lerp(0.0004, 0.0031, mouseSensitivity)
    rotateCamera(e.movementX * sens, e.movementY * sens)
  }
}

function rotateCamera(deltaX: number, deltaY: number) {
  cameraEuler.x = wrapAngleInRadians(cameraEuler.x - deltaX)
  cameraEuler.y = clamp(cameraEuler.y + deltaY * mouseYInversion, -87 * DEG_TO_RAD, 87 * DEG_TO_RAD)
}

export function setCameraToStartPosition() {
  //start positions:
  vec3Set(cameraPos, 20, 8, 52)
  vec2Set(cameraEuler, 178.4 * DEG_TO_RAD, 0)
}
