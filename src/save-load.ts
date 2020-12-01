import { GAME_STATE } from './state/game-state'
import { ANIMATIONS } from './state/animations'
import { cameraPos, cameraEuler } from './camera'
import { setText, clearTexts } from './text'
import { startOrResumeClick, loadGameButton, saveGameButton, gameStarted } from './page'

const data = [GAME_STATE, ANIMATIONS, cameraPos, cameraEuler]

function deepMerge(original: any, item: any) {
  for (const key in item) {
    if (typeof item[key] === 'object') {
      deepMerge(original[key], item[key])
    } else {
      original[key] = item[key]
    }
  }
}

const LOCAL_STORAGE_KEY = 'joiners30-12-20'

const SAVE_GAME = () => {
  if (gameStarted) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
    setText('Saved', 2)
    startOrResumeClick(false)
    loadGameButton.className = ''
  }
}

const getDataFromLocalStorage = () => localStorage.getItem(LOCAL_STORAGE_KEY)

const LOAD_GAME = () => {
  const savedGame = getDataFromLocalStorage()
  if (savedGame) {
    clearTexts()
    startOrResumeClick(false) //call this first to update the "started" state before actually setting the load game state:
    deepMerge(data, JSON.parse(savedGame))
    setText('Game loaded', 2)
  }
}

saveGameButton.onclick = SAVE_GAME
loadGameButton.onclick = LOAD_GAME

loadGameButton.className = getDataFromLocalStorage() ? '' : 'X'
