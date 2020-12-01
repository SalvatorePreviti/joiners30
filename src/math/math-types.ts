export interface Vec2 {
  x: number
  y: number
}

export type Vec2In = Readonly<Vec2>

export type Vec2Out = Vec2

export interface Vec3 {
  x: number
  y: number
  z: number
}

export type Vec3In = Readonly<Vec3>

export type Vec3Out = Vec3

export interface Vec4 {
  x: number
  y: number
  z: number
  w: number
}

export type Vec4In = Readonly<Vec3>

export type Vec4Out = Vec4

export type Mat3 = Float32Array

export type Mat3In = Float32Array

export type Mat3Out = Float32Array

export type Mat4 = Float32Array

export type Mat4In = Float32Array

export type Mat4Out = Float32Array
