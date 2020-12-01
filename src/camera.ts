import {
  PressedKeys,
  KEY_FORWARD,
  KEY_BACKWARD,
  KEY_STRAFE_LEFT,
  KEY_STRAFE_RIGHT,
  KEY_FLY_UP,
  KEY_FLY_DOWN,
  KEY_RUN
} from './keyboard'

import {
  debug_mode,
  debug_updateCameraPosition,
  debug_updateCameraDirection,
  debug_updateCameraEulerAngles
} from './debug'
import { canvasElement, mouseYInversion, headBobEnabled } from './page'
import { cos, sin, wrapAngleInRadians, clamp, DEG_TO_RAD } from './math/scalar'
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
import { Vec2, vec2New } from './math/vec2'
import { typedArraySet } from './core/arrays'
import { RUMBLING } from './state/animations'
import { GAME_STATE } from './state/game-state'
import { gameTimeDelta, gameTime } from './time'
import type { Mat3 } from './math/math-types'

const CAMERA_SPEED_DEFAULT = 2.1

const CAMERA_SPEED_RUN = debug_mode ? 20 : 5.5

const MOUSE_ROTATION_SENSITIVITY_X = 0.001
const MOUSE_ROTATION_SENSITIVITY_Y = MOUSE_ROTATION_SENSITIVITY_X

/** Camera position */
export const cameraPos: Vec3 = vec3New(103, 44, 9)

/** head bob value */
export let headBob = 0

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
  let { x: yaw, y: pitch } = cameraEuler
  if (RUMBLING) {
    yaw += sin(gameTime * 100) * 0.005
    pitch += sin(gameTime * 200) * 0.005
  }

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

  if (!GAME_STATE._gameEnded) {
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
    cameraEuler.x = wrapAngleInRadians(cameraEuler.x - e.movementX * MOUSE_ROTATION_SENSITIVITY_X)

    cameraEuler.y = clamp(
      cameraEuler.y + e.movementY * mouseYInversion * MOUSE_ROTATION_SENSITIVITY_Y,
      -87 * DEG_TO_RAD,
      87 * DEG_TO_RAD
    )
  }
}
