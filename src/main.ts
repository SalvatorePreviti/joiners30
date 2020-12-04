import './css/styles.css'
import { showMainMenu, mainMenuVisible, renderWidth, renderHeight, initPage, bioHtmlVisibleId } from './page'
import { gl, glFrameBuffer } from './page-elements'
import { debug_beginFrame, debug_endFrame, debug_trycatch_wrap, debug_log, debug_updateCameraPosition } from './debug'

import { updateCamera, cameraPos } from './camera'
import { buildHeightmapTexture } from './texture-heightmap'
import { buildNoiseTexture } from './texture-noise'
import { GAME_STATE } from './game-state'
import { updateGameObjects } from './game-state-update'
import { updateText } from './text'
import { loadMainShader, mainShader, prerenderedShader } from './shader-program'
import { updateCollider, initCollider } from './collider'
import { initPrerenderedTexture, PRERENDERED_TEXTURE_SIZE } from './texture-prerendered'
import { initSaveLoad } from './save-load'
import { GL_TRIANGLES, GL_FRAMEBUFFER } from './gl/gl-constants'
import { updateTime, gameTime } from './time'
import { initKeyboard } from './keyboard'

initPage()
initSaveLoad()

setTimeout(() => {
  buildNoiseTexture()
  buildHeightmapTexture()
  initPrerenderedTexture()
  initCollider()
  loadMainShader()
  showMainMenu()
  initKeyboard()

  const animationFrame = debug_trycatch_wrap(
    (browserTimeInMilliseconds: number) => {
      requestAnimationFrame(animationFrame)

      debug_beginFrame()

      if (!updateTime(browserTimeInMilliseconds, mainMenuVisible)) {
        debug_endFrame(gameTime)
        return
      }

      updateCamera()

      if (!mainMenuVisible) {
        if (!GAME_STATE._gameEnded && bioHtmlVisibleId < 0) {
          updateCollider()
        }

        updateGameObjects()

        updateText()
      }

      debug_updateCameraPosition(cameraPos)

      // Prerender

      prerenderedShader(PRERENDERED_TEXTURE_SIZE, PRERENDERED_TEXTURE_SIZE)

      gl.bindFramebuffer(GL_FRAMEBUFFER, glFrameBuffer)
      gl.drawArrays(GL_TRIANGLES, 0, 3)
      gl.bindFramebuffer(GL_FRAMEBUFFER, null)

      // Render main scene

      mainShader(renderWidth, renderHeight)

      gl.drawArrays(GL_TRIANGLES, 0, 3)

      debug_endFrame(gameTime)
    },
    { rethrow: false, file: import.meta.url }
  )

  requestAnimationFrame(animationFrame)
}, 99)

if (import.meta.hot) {
  const reloadMainShader = () => {
    debug_log('reloading main shader')
    loadMainShader()
    buildHeightmapTexture()
    initPrerenderedTexture()
  }

  import.meta.hot.on('/src/shaders/vertex.vert', reloadMainShader)
  import.meta.hot.on('/src/shaders/fragment.frag', reloadMainShader)
}
