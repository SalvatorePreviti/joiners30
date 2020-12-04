import { showBio, mainMenuVisible, showMainMenu, bioHtmlVisibleId } from './page'
import { GAME_STATE } from './game-state'
import { gameObjectsAction } from './game-state-update'
import { KEY_ACTION, KEY_MAIN_MENU, PressedKeys, keyCodeMap, keyMap } from './keyboard-state'

function getKeyId(e: KeyboardEvent) {
  return keyMap[keyCodeMap.get(e.keyCode)] || keyMap[e.key]
}

function cancelKeyEvent(e: KeyboardEvent) {
  e.cancelBubble = true
  if (e.preventDefault) {
    e.preventDefault()
  }
  if (e.stopPropagation) {
    e.stopPropagation()
  }
  return false
}

export const initKeyboard = () => {
  const setKeyPressed = (e: KeyboardEvent, value: boolean) => {
    const keyId = getKeyId(e)
    if (!e.repeat && (GAME_STATE._gameEnded || mainMenuVisible) && (keyId === KEY_MAIN_MENU || keyId === KEY_ACTION)) {
      showBio(-1)
    }

    if (e.metaKey || !document.activeElement || mainMenuVisible) {
      PressedKeys.length = 0 // Clear pressed status to prevent key sticking when alt+tabbing or showing the menu
      return undefined
    }

    if (keyId) {
      if (PressedKeys[keyId] !== value) {
        if (value && !e.repeat) {
          if (keyId === KEY_MAIN_MENU) {
            showMainMenu()
          } else if (keyId === KEY_ACTION) {
            if (!GAME_STATE._gameEnded) {
              showBio(-1)
            }
            if (bioHtmlVisibleId < 0) {
              gameObjectsAction()
            }
          }
        }

        PressedKeys[keyId] = value
      }

      return cancelKeyEvent(e)
    }

    return undefined
  }

  document.addEventListener('keydown', (e: KeyboardEvent) => setKeyPressed(e, true), false)
  document.addEventListener('keyup', (e: KeyboardEvent) => setKeyPressed(e, false), false)
  document.addEventListener('keypress', (e) => (getKeyId(e) ? cancelKeyEvent(e) : undefined), false)
}
