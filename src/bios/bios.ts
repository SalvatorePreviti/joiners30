import { bios } from './bios-data/bios-data'

export interface Bio {
  _loaded?: boolean
  name: string
  team: string
  pos: string
  from: string
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

const getBio = (index: number) => (index < 0 ? undefined : bios[index % bios.length])

export { bios, getBio, preloadBiosImages }
