declare module 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js' {
  import { Base } from 'wa-sqlite/src/VFS.js'

  export class OriginPrivateFileSystemVFS extends Base {}
}

declare module 'wa-sqlite/src/examples/AccessHandlePoolVFS.js' {
  export class AccessHandlePoolVFS {
    isReady: Promise<void>
    name: string
    constructor(directoryPath: string)
  }
}

declare module 'wa-sqlite/src/VFS.js' {
  export class Base {
    name: string
    mxPathname: number
  }
}
