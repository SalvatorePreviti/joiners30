import { vec3New, vec3Distance, vec3Direction, vec3Temp0, vec3Dot, vec3Set, Vec3 } from '../math/vec3'
import { runAnimation, ANIMATIONS } from './animations'
import { cameraPos, cameraDir, cameraEuler } from '../camera'
import { setText } from '../text'
import { KEY_ACTION, KeyFunctions, PressedKeys } from '../keyboard'
import { objectValues } from '../core/objects'
import { vec2Set } from '../math/vec2'
import { DEG_TO_RAD } from '../math/scalar'

interface GameObject {
  _location: Vec3
  _visible?: boolean
  _lookAtDistance: number
  _onInteract: () => void //perform action when ACTION key is pressed while looking at
  _onLookAt: () => string | void //return a string to display, or perform action
}

const INVENTORY = {
  _key: false,
  _antennaKey: false,
  _floppy: false
}

const GAME_OBJECTS = {
  _key: {
    _location: vec3New(-45.5, 2, 7.4),
    _visible: true,
    _lookAtDistance: 2,
    _onInteract() {
      this._visible = false
      INVENTORY._key = true
      setText('You picked up a key', 3)
    },
    _onLookAt: () => 'A key, how convenient! [press E or Space to collect]'
  },
  _antennaInitialLookat: {
    _location: vec3New(-40.5, 4.5, 11),
    _visible: true,
    _lookAtDistance: 2.8,
    _onInteract() {},
    _onLookAt: () => 'That looks like a big antenna, maybe I can call for help if I can make it there…'
  },
  _antennaDoor: {
    _location: vec3New(8.5, 14, 2),
    _visible: true,
    _lookAtDistance: 2.5,
    _checked: false,
    _onInteract() {
      if (INVENTORY._antennaKey) {
        this._visible = false
        runAnimation(ANIMATIONS._antennaDoor)
      }
      this._checked = true
    },
    _onLookAt() {
      return this._checked ? 'A locked door… The symbol on it looks familiar' : 'A door'
    }
  },
  _antennaKey: {
    _location: vec3New(0, 1000, 0), //initial location is far away
    _visible: true,
    _lookAtDistance: 2.5,
    _onInteract() {
      INVENTORY._antennaKey = true
      this._visible = false
      GAME_OBJECTS._monumentButton._visible = true
      runAnimation(ANIMATIONS._monumentDescend, -1) //play monumentDescend in reverse
    },
    _onLookAt: () => 'A key'
  },
  _antennaOilrigLever: {
    _location: vec3New(5.7, 14.2, -1.9),
    _visible: true,
    _lookAtDistance: 1.5,
    _onInteract() {
      if (cameraDir.z <= 0) {
        this._visible = false
        runAnimation(ANIMATIONS._oilrigRamp)
        GAME_OBJECTS._oilrigBridge._visible = false
      }
    },
    _onLookAt: () => (cameraDir.z <= 0 ? 'A lever [press E or Space]' : '')
  },
  _antennaConsole: {
    _location: vec3New(4.8, 14.4, 3.7),
    _visible: true,
    _lookAtDistance: 1.5,
    _onInteract() {
      if (ANIMATIONS._antennaRotation._running && INVENTORY._floppy) {
        runAnimation(ANIMATIONS._afterFloppyInsert)
        vec3Set(cameraPos, 5.844, 14.742, 4)
        vec2Set(cameraEuler, -90 * DEG_TO_RAD, 17 * DEG_TO_RAD)
      }
    },
    _onLookAt: () => "A submarine? That's my way out! [Press E or Space to continue]"
  },
  _monumentButton: {
    _location: vec3New(47.5, 4, 30.5),
    _visible: true,
    _lookAtDistance: 1.5,
    _onInteract() {
      if (INVENTORY._antennaKey) {
        setText('I already got the key', 2)
      }
      runAnimation(ANIMATIONS._monumentDescend)
      this._visible = false
    },
    _onLookAt() {
      return 'A button [press E or Space]'
    }
  },
  _oilrigBridge: {
    _location: vec3New(11.8, 2, -34.3),
    _visible: true,
    _lookAtDistance: 5,
    _onInteract() {},
    _onLookAt: () => 'This bridge looks broken'
  },
  _oilRigLever2: {
    _location: vec3New(26.6, 5.5, -55.6),
    _lookAtDistance: 2.5,
    _visible: true,
    _onInteract() {
      runAnimation(ANIMATIONS._oilrigRamp2)
      this._visible = false
    },
    _onLookAt() {
      return 'A Lever'
    }
  },
  _oilrigWheel: {
    _location: vec3New(26, 13.5, -52.9),
    _visible: true,
    _lookAtDistance: 2,
    _onInteract() {
      runAnimation(ANIMATIONS._oilrigWheel)
      this._visible = false
    },
    _onLookAt: () => 'A big wheel, I suppose it will feed fuel to the generator…'
  },
  _prisonDoor: {
    _location: vec3New(-43, 3.4, 15),
    _lookAtDistance: 2.2,
    _visible: true,
    _checked: false,
    _onInteract() {
      if (INVENTORY._key) {
        this._visible = false
        runAnimation(ANIMATIONS._prisonDoor)
        GAME_OBJECTS._antennaInitialLookat._visible = false //no longer do the initial antenna lookat text
      }
      this._checked = true
    },
    _onLookAt() {
      return INVENTORY._key
        ? 'Open the door with the key [press E or Space]'
        : this._checked
        ? 'A locked door, I need a key'
        : 'A door [press E or Space to open]'
    }
  },
  _floppyDisk: {
    _location: vec3New(12.2, 22.3, 38.7),
    _lookAtDistance: 2,
    _visible: true,
    _onInteract() {
      this._visible = false
      INVENTORY._floppy = true
    },
    _onLookAt: () => 'A floppy disk'
  },
  _bottomLiftButton: {
    _location: vec3New(9.3, 2, 36.1),
    _lookAtDistance: 2,
    _visible: true,
    _onInteract() {
      if (!ANIMATIONS._antennaRotation._running) {
        return
      }
      if (ANIMATIONS._elevatorHeight._value === ANIMATIONS._elevatorHeight._initial) {
        runAnimation(ANIMATIONS._elevatorHeight)
      }
      if (ANIMATIONS._elevatorHeight._value === ANIMATIONS._elevatorHeight._max) {
        runAnimation(ANIMATIONS._elevatorHeight, -1) //run it backwards
      }
    },
    _onLookAt() {
      if (!ANIMATIONS._antennaRotation._running) {
        return 'Elevator is out of order'
      }
      if (ANIMATIONS._elevatorHeight._value === ANIMATIONS._elevatorHeight._initial) {
        return 'Activate'
      }
      if (ANIMATIONS._elevatorHeight._value === ANIMATIONS._elevatorHeight._max) {
        return 'Call elevator'
      }
      return ''
    }
  },
  _topLiftButton: {
    _location: vec3New(9.3, 22.5, 36.1),
    _lookAtDistance: 2,
    _visible: true,
    _onInteract: () => GAME_OBJECTS._bottomLiftButton._onInteract(),
    _onLookAt() {
      if (ANIMATIONS._elevatorHeight._value === ANIMATIONS._elevatorHeight._max) {
        return 'Activate'
      }
      if (ANIMATIONS._elevatorHeight._value === ANIMATIONS._elevatorHeight._initial) {
        return 'Call elevator'
      }
      return ''
    }
  },
  _submarine: {
    _location: vec3New(-46.5, 2, -28.5),
    _lookAtDistance: 5,
    _visible: false,
    _onLookAt: () => 'A submarine! My way out. [press E or Space to Escape!]',
    _gameEnded: false,
    _onInteract() {
      this._gameEnded = true
      runAnimation(ANIMATIONS._submarine, -1)
      vec3Set(cameraPos, -42, 12, -47)
      vec2Set(cameraEuler, -12.7 * DEG_TO_RAD, 33.7 * DEG_TO_RAD)
      setText('', 3) //3 seconds delay
      setText(
        '<h1>The End</h1><h2>you found your way out</h2><h3>Game by Salvatore Previti & Ben Clark</h3>Thank you for playing!',
        10000
      )
    }
  }
}

const GAME_OBJECTS_LIST: GameObject[] = objectValues(GAME_OBJECTS)

const getVisibleObject = (): GameObject => {
  for (const gameObject of GAME_OBJECTS_LIST) {
    if (gameObject._visible) {
      const objectLocation = gameObject._location
      if (vec3Distance(objectLocation, cameraPos) <= gameObject._lookAtDistance) {
        if (vec3Dot(cameraDir, vec3Direction(vec3Temp0, cameraPos, objectLocation)) > 0.9) {
          return gameObject
        }
      }
    }
  }
  return undefined
}

const updateGameObjects = () => {
  const visibleObject = getVisibleObject()
  setText((visibleObject && visibleObject._onLookAt()) || '')
  if (visibleObject && PressedKeys[KEY_ACTION]) {
    visibleObject._onInteract()
  }
}

export { GAME_OBJECTS, INVENTORY, updateGameObjects }
