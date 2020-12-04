import { bios } from './bios-data/bios-data'

export interface Bio {
  id: number
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

const getBio = (index: number) => (index >= 0 ? bios[index % bios.length] : undefined)

export { bios, getBio }
