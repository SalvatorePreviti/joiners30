import { GAME_STATE } from './game-state'
import { cameraPos, cameraEuler } from './camera'
import { setText, clearTexts } from './text'
import { startOrResumeClick, gameStarted } from './page'
import { loadGameButton, saveGameButton } from './page-elements'

export const initSaveLoad = () => {
  const data = [GAME_STATE, cameraPos, cameraEuler]

  const LOCAL_STORAGE_KEY = 'joiners301220'

  const getDataFromLocalStorage = () => localStorage.getItem(LOCAL_STORAGE_KEY)

  const saveGame = () => {
    if (gameStarted) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
      setText('Saved', 2)
      startOrResumeClick(false)
      loadGameButton.className = ''
    }
  }

  const loadGame = () => {
    const savedGame = getDataFromLocalStorage()
    if (savedGame) {
      clearTexts()
      startOrResumeClick(false) //call this first to update the "started" state before actually setting the load game state:
      deepMerge(data, JSON.parse(savedGame))
      setText('Game loaded', 2)
    }
  }

  saveGameButton.onclick = saveGame
  loadGameButton.onclick = loadGame

  loadGameButton.className = getDataFromLocalStorage() ? '' : 'X'
}

function deepMerge(original: any, item: any) {
  for (const key in item) {
    if (typeof item[key] === 'object') {
      deepMerge(original[key], item[key])
    } else {
      original[key] = item[key]
    }
  }
}
