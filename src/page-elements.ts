export const body = document.body

export const canvasElement = document.getElementById('C') as HTMLCanvasElement

export const gameTextElement = document.getElementById('T') as HTMLDivElement

export const foundTextElement = document.getElementById('found-text') as HTMLDivElement
/** The main element that holds the canvas and the main menu. */

export const mainElement = document.getElementById('M') as HTMLDivElement

export const newGameButton = document.getElementById('R') as HTMLDivElement

export const highQualityCheckbox = document.getElementById('Q') as HTMLInputElement

export const invertYCheckbox = document.getElementById('Y') as HTMLInputElement

export const mouseSensitivitySlider = document.getElementById('V') as HTMLInputElement

export const headBobCheckbox = document.getElementById('H') as HTMLInputElement

export const disksElement = document.getElementById('disks')

export const disksWonElement = document.getElementById('disks-won')

export const saveGameButton = document.getElementById('S')

export const loadGameButton = document.getElementById('L')

export const gl = canvasElement.getContext('webgl2', {
  /** Boolean that indicates if the canvas contains an alpha buffer. */
  alpha: false,
  /** Boolean that hints the user agent to reduce the latency by desynchronizing the canvas paint cycle from the event loop */
  desynchronized: true,
  /** Boolean that indicates whether or not to perform anti-aliasing. */
  antialias: false,
  /** Boolean that indicates that the drawing buffer has a depth buffer of at least 16 bits. */
  depth: false,
  /** Boolean that indicates if a context will be created if the system performance is low or if no hardware GPU is available. */
  failIfMajorPerformanceCaveat: false,
  /** A hint to the user agent indicating what configuration of GPU is suitable for the WebGL context. */
  powerPreference: 'high-performance',
  /** If the value is true the buffers will not be cleared and will preserve their values until cleared or overwritten. */
  preserveDrawingBuffer: false,
  /** Boolean that indicates that the drawing buffer has a stencil buffer of at least 8 bits. */
  stencil: false
})
/** Main framebuffer used for pregenerating the heightmap and to render the collision shader */

export const glFrameBuffer: WebGLFramebuffer = gl.createFramebuffer()
