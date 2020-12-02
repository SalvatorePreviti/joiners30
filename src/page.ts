import { min, DEG_TO_RAD } from './math/scalar'
import { objectAssign } from './core/objects'
import { KEY_MAIN_MENU, KeyFunctions, KEY_ACTION } from './keyboard'
import { vec3Set } from './math/vec3'
import { vec2Set } from './math/vec2'
import { cameraPos, cameraEuler } from './camera'
import { setText } from './text'
import { debug_mode } from './debug'
import { GAME_STATE } from './state/game-state'

import bios_sp_html from './bios/sp.html'

export const body = document.body

export const canvasElement = document.getElementById('C') as HTMLCanvasElement

export const gameTextElement = document.getElementById('T') as HTMLDivElement

export const foundTextElement = document.getElementById('found-text') as HTMLDivElement

/** Total horizontal and vertical padding to apply to the main element */
const MAIN_ELEMENT_PADDING = 30

/** The aspext ratio of the main element. Main and canvas will be resized accordingly. */
const MAIN_ELEMENT_ASPECT_RATIO = 1.5

/** The maximum width of the main element, and the canvas. */
const MAIN_ELEMENT_MAX_WIDTH = 2000

export let mainMenuVisible: boolean

export let renderWidth: number

export let renderHeight: number

export let mouseYInversion = 1

export let headBobEnabled = true

export let mouseSensitivity = 0.5

/** The main element that holds the canvas and the main menu. */
const mainElement = document.getElementById('M') as HTMLDivElement

const newGameButton = document.getElementById('R') as HTMLDivElement

const highQualityCheckbox = document.getElementById('Q') as HTMLInputElement
const invertYCheckbox = document.getElementById('Y') as HTMLInputElement
const mouseSensitivitySlider = document.getElementById('V') as HTMLInputElement
const headBobCheckbox = document.getElementById('H') as HTMLInputElement
const bioHtmlContentDiv = document.getElementById('bioc') as HTMLDivElement

export const saveGameButton = document.getElementById('S')

export const loadGameButton = document.getElementById('L')

/** Handle resize event to update canvas size. */
const handleResize = () => {
  let cw = min(MAIN_ELEMENT_MAX_WIDTH, innerWidth - MAIN_ELEMENT_PADDING)
  let ch = innerHeight - MAIN_ELEMENT_PADDING
  if (MAIN_ELEMENT_ASPECT_RATIO >= cw / ch) {
    ch = cw / MAIN_ELEMENT_ASPECT_RATIO
  } else {
    cw = ch * MAIN_ELEMENT_ASPECT_RATIO
  }

  const whStyles = { width: cw | 0, height: ch | 0, fontSize: `${(ch / 23) | 0}px` }
  objectAssign(mainElement.style, whStyles)
  objectAssign(canvasElement.style, whStyles)

  let { clientWidth: w, clientHeight: h } = mainElement
  if (!highQualityCheckbox.checked) {
    w = (w / 2) | 0
    h = (h / 2) | 0
  }

  renderWidth = w
  renderHeight = h
  canvasElement.width = w
  canvasElement.height = h
}

export const showMainMenu = () => {
  mainMenuVisible = true
  body.classList.add('N')
  document.exitPointerLock()
}

document.onpointerlockchange = () => {
  // document.pointerLockElement is falsy if we've unlocked
  if (!document.pointerLockElement) {
    if (!debug_mode) {
      showMainMenu()
    }
  }
}

const canvasRequestPointerLock = (e?: MouseEvent) =>
  (!e || !e.button) && !mainMenuVisible && canvasElement.requestPointerLock()

export let gameStarted: Boolean

export const startOrResumeClick = (newGame = true) => {
  if (!gameStarted) {
    saveGameButton.className = ''
    if (newGame) {
      resetHtmlState()
      setText('Find all the floppy disks!', 2)
    }
    //set camera pos
    newGameButton.innerText = 'Resume Game'
    //start positions:
    vec3Set(cameraPos, 20, 8, 52)
    vec2Set(cameraEuler, 178.4 * DEG_TO_RAD, 0)

    gameStarted = true
  }
  mainMenuVisible = false
  body.classList.remove('N')
  canvasRequestPointerLock()
}

handleResize()
onresize = handleResize

newGameButton.onclick = () => startOrResumeClick()

KeyFunctions[KEY_MAIN_MENU] = showMainMenu
KeyFunctions[KEY_ACTION] = (repeat: boolean) => {
  if (!repeat) {
    GAME_STATE._bioIndex = -1
  }
}

canvasElement.onmousedown = canvasRequestPointerLock
gameTextElement.onmousedown = canvasRequestPointerLock

highQualityCheckbox.onchange = handleResize

invertYCheckbox.onchange = () => {
  mouseYInversion = invertYCheckbox.checked ? -1 : 1
}

headBobCheckbox.onchange = () => {
  headBobEnabled = headBobCheckbox.checked
}

mouseSensitivitySlider.onchange = () => {
  mouseSensitivity = parseInt(mouseSensitivitySlider.value) / 100
}

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

export let bioHtmlVisible: boolean | null = null

let _foundHtmlCount: number = -2

export function resetHtmlState() {
  bioHtmlVisible = null
  _foundHtmlCount = -2
}

export function updateBio() {
  if (_foundHtmlCount !== GAME_STATE._foundCount) {
    const floppiesCount = GAME_STATE._floppies.length
    _foundHtmlCount = GAME_STATE._foundCount
    if (_foundHtmlCount >= floppiesCount) {
      foundTextElement.innerHTML =
        '<h2 style="text-align:center"><b>🏆</b><br/>Congratulations!<br/>You found all the joiners!</h2>'
    } else {
      foundTextElement.innerHTML = `${_foundHtmlCount}/${floppiesCount}&nbsp;<b>💾</b>`
    }
  }
  const bioVisible = !mainMenuVisible && GAME_STATE._bioIndex >= 0
  if (bioHtmlVisible !== bioVisible) {
    bioHtmlVisible = bioVisible
    if (bioHtmlVisible) {
      body.classList.add('bio')
      bioHtmlContentDiv.innerHTML = bios_sp_html
    } else {
      body.classList.remove('bio')
    }
  }
}
