import { min } from './math/scalar'
import { objectAssign, objectKeys } from './core/objects'
import { setCameraToStartPosition } from './camera'
import { setText } from './text'
import { debug_mode } from './debug'
import { GAME_STATE } from './game-state'
import { bios, getBio } from './bios/bios'
import { arrayFrom } from './core/arrays'
import {
  mainElement,
  canvasElement,
  highQualityCheckbox,
  body,
  saveGameButton,
  newGameButton,
  gameTextElement,
  invertYCheckbox,
  headBobCheckbox,
  mouseSensitivitySlider,
  foundTextElement,
  disksElement
} from './page-elements'

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

export let bioHtmlVisibleId: number = -2

export let gameStarted: Boolean

const _collectedBiosIdsSet = new Set<number>()

const _diskButtonElements: HTMLSpanElement[] = []

const LOCAL_STORAGE_BIOS_KEY = 'newjoiners30_collected'

/** Handle resize event to update canvas size. */
export const handleResize = () => {
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
  if (!mainMenuVisible) {
    mainMenuVisible = true
    body.classList.add('N')
    showBio(-1)
  }
  document.exitPointerLock()
}

const canvasRequestPointerLock = (e?: MouseEvent) => {
  if (!GAME_STATE._gameEnded && (!e || !e.button) && !mainMenuVisible) {
    canvasElement.requestPointerLock()
  }
}

export const startOrResumeClick = (newGame = true) => {
  if (!gameStarted) {
    saveGameButton.className = ''
    if (newGame) {
      showBio(-1)
      setText('Find all the floppy disks!', 2)
      updateDisks()
    }
    //set camera pos
    newGameButton.innerText = 'Resume Game'
    setCameraToStartPosition()

    gameStarted = true
  }
  mainMenuVisible = false
  showBio(-1)
  body.classList.remove('N')
  canvasRequestPointerLock()
}

export function updateDisks() {
  if (GAME_STATE._gameEnded) {
    foundTextElement.innerHTML = `<div class="won"><h2 style="text-align:center"><b>🏆</b><br/><br/>Congratulations!<br/>You found all the joiners!</h2><br/><div class="disks">${disksElement.innerHTML}</div></div>`
    const buttons = foundTextElement.getElementsByClassName('button')
    for (let i = 0; i < buttons.length; ++i) {
      const button = buttons[i] as HTMLSpanElement
      button.onclick = () => {
        showBio(parseInt(button.getAttribute('data-id')))
      }
    }
    document.exitPointerLock()
  } else {
    const floppiesCount = GAME_STATE._floppies.length
    foundTextElement.innerHTML = `${GAME_STATE._foundCount}/${floppiesCount}&nbsp;<b>💾</b>`
  }
}

export function showBio(id: number) {
  if (bioHtmlVisibleId === id) {
    return
  }

  bioHtmlVisibleId = id

  const bio = getBio(id)
  if (!bio) {
    body.classList.remove('screen')
    return
  }

  setText('')
  bioCollected(id)

  localStorage.setItem(LOCAL_STORAGE_BIOS_KEY, JSON.stringify(arrayFrom(_collectedBiosIdsSet)))

  updateDisks()

  for (const key of objectKeys(bio)) {
    const value = bio[key]
    const element = document.getElementById(`bio-${key}`)
    if (element) {
      if (key === 'img') {
        ;(element as HTMLImageElement).src = value
        ;(element as HTMLImageElement).alt = bio.name
      } else {
        element.getElementsByTagName('i')[0].innerText = value
      }
    }
  }
  document.getElementById('screen2').scrollTop = 0
  body.classList.add('screen')
}

function bioCollected(id: number) {
  const bio = getBio(id)
  if (bio && !_collectedBiosIdsSet.has(id)) {
    const index = _collectedBiosIdsSet.size
    const button = _diskButtonElements[index]
    if (button) {
      button.className = 'button collected'
      button.setAttribute('data-id', `${bio.id}`)
      button.title = bio.name
      _collectedBiosIdsSet.add(id)
    }
  }
}

function loadCollectedBiosIdsFromLocalStorage() {
  const data = localStorage.getItem(LOCAL_STORAGE_BIOS_KEY) || '[]'
  try {
    for (const id of JSON.parse(data)) {
      bioCollected(id)
    }
  } catch (_) {}
}

export function initPage() {
  for (let i = 0; i < bios.length; ++i) {
    const button = document.createElement('span')
    button.innerText = '💾'
    button.title = '???'
    button.className = 'button'
    disksElement.appendChild(button)
    button.onclick = () => {
      showBio(parseInt(button.getAttribute('data-id')))
    }
    _diskButtonElements.push(button)
  }

  loadCollectedBiosIdsFromLocalStorage()

  handleResize()

  window.addEventListener('resize', handleResize)

  document.onpointerlockchange = () => {
    // document.pointerLockElement is falsy if we've unlocked
    if (!document.pointerLockElement) {
      if (!debug_mode && !GAME_STATE._gameEnded) {
        showMainMenu()
      }
    }
  }

  newGameButton.onclick = () => startOrResumeClick()

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

  document.getElementById('screen').addEventListener(
    'click',
    () => {
      if (mainMenuVisible) {
        showBio(-1)
      } else {
        canvasRequestPointerLock()
      }
    },
    false
  )
}
