import {
  GL_UNSIGNED_BYTE,
  GL_RGBA,
  GL_TEXTURE_2D,
  GL_FRAMEBUFFER,
  GL_COLOR_ATTACHMENT0,
  GL_TEXTURE5,
  GL_TRIANGLES
} from './gl/gl-constants'
import { collisionShader } from './shader-program'
import { debug_collisionBufferCanvasPrepare } from './debug'
import { PI, cos, sin, abs, unpackFloatBytes4, max } from './math/scalar'
import { cameraPos } from './camera'
import { vec3Length } from './math/vec3'
import { gl } from './page-elements'

const CAMERA_MAX_DISTANCE_FROM_CENTER = 100

const COLLIDER_SIZE = 128

const colliderTexture: WebGLTexture = gl.createTexture()
const colliderFrameBuffer = gl.createFramebuffer()

const colliderBuffer = new Uint8Array(COLLIDER_SIZE * COLLIDER_SIZE * 4)

debug_collisionBufferCanvasPrepare(colliderBuffer, COLLIDER_SIZE, COLLIDER_SIZE)

const readDist = (x: number, y: number): number => {
  const bufIdx = y * COLLIDER_SIZE * 4 + x * 4
  return unpackFloatBytes4(
    colliderBuffer[bufIdx],
    colliderBuffer[bufIdx + 1],
    colliderBuffer[bufIdx + 2],
    colliderBuffer[bufIdx + 3]
  )
}

const getAngleFromIdx = (x: number): number => -((PI * (x - 64)) / 64) - PI / 2

export const initCollider = () => {
  gl.activeTexture(GL_TEXTURE5)
  gl.bindTexture(GL_TEXTURE_2D, colliderTexture)
  gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, COLLIDER_SIZE, COLLIDER_SIZE, 0, GL_RGBA, GL_UNSIGNED_BYTE, null)
  gl.bindFramebuffer(GL_FRAMEBUFFER, colliderFrameBuffer)
  gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, colliderTexture, 0)
}

export const updateCollider = () => {
  collisionShader(COLLIDER_SIZE, COLLIDER_SIZE, true)

  gl.bindFramebuffer(GL_FRAMEBUFFER, colliderFrameBuffer)
  gl.drawArrays(GL_TRIANGLES, 0, 3)
  gl.readPixels(0, 0, COLLIDER_SIZE, COLLIDER_SIZE, GL_RGBA, GL_UNSIGNED_BYTE, colliderBuffer)
  gl.bindFramebuffer(GL_FRAMEBUFFER, null)

  //Ground Collision:
  let totalY = 0
  for (let x = 0; x < 128; x++) {
    let maxY = -99
    for (let y = 0; y < 32; y++) {
      maxY = max(readDist(x, y), maxY)
    }
    totalY += maxY
  }
  const ddy = totalY / 128 - 0.2 //Take the average distance from the ground and subtract the value used in the shader

  //Cylinder Collision:
  let ddx = 0
  let ddz = 0
  for (let y = 32; y < 96; ++y) {
    for (let x1 = 0; x1 < 64; ++x1) {
      const x2 = x1 + 64

      const dist1 = readDist(x1, y)
      const dist2 = readDist(x2, y)

      const angle1 = getAngleFromIdx(x1)
      const angle2 = getAngleFromIdx(x2)

      const dx = cos(angle1) * dist1 + cos(angle2) * dist2
      const dz = sin(angle1) * dist1 + sin(angle2) * dist2

      if (abs(dx) > abs(ddx)) {
        ddx = dx
      }
      if (abs(dz) > abs(ddz)) {
        ddz = dz
      }
    }
  }

  cameraPos.x += ddx
  cameraPos.y = max(cameraPos.y + ddy, 0.9)
  cameraPos.z += ddz

  const distanceFromCenter = vec3Length(cameraPos)
  if (distanceFromCenter >= CAMERA_MAX_DISTANCE_FROM_CENTER) {
    cameraPos.x *= CAMERA_MAX_DISTANCE_FROM_CENTER / distanceFromCenter
    cameraPos.z *= CAMERA_MAX_DISTANCE_FROM_CENTER / distanceFromCenter
  }
}
