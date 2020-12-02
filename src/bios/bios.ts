import { objectKeys } from '../core/objects'
import { bios } from './bios-data/bios-data'
import template from './template.html'
import './template.css'

export interface Bio {
  _loaded?: boolean
  name: string
  team: string
  pos: string
  fun1: string
  fun2: string
  fun3: string
  dark1: string
  dark2: string
  dark3: string
  img: string
}

function preloadBiosImages() {
  for (let i = 0; i < bios.length; i++) {
    const img = new Image()
    const url = bios[i].img
    if (!url.startsWith('data')) {
      img.src = url
      img.onload = () => (bios[i]._loaded = true)
      preloadBiosImages[`_${i}`] = img
    }
  }
}

const _tempDiv = document.createElement('div')

const biosHtml: string[] = bios.map((bio) => {
  let html = template.replace(`$img`, bio.img)
  for (const key of objectKeys(bio)) {
    console.log(key)
    if (key !== 'img') {
      _tempDiv.innerText = bio[key]
      html = html.replace(`$${key}`, _tempDiv.innerHTML)
    }
  }
  return html
})

export const getBio = (index: number) => (index < 0 ? undefined : bios[index % bios.length])

export const getBioHtml = (index: number) => (index < 0 ? undefined : biosHtml[index % bios.length])

export { bios, preloadBiosImages }
