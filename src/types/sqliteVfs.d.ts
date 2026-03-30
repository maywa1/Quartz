declare module 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js' {
  import { Base } from 'wa-sqlite/src/VFS.js'

  export class OriginPrivateFileSystemVFS extends Base {}
}

declare module 'wa-sqlite/src/VFS.js' {
  export class Base {
    name: string
    mxPathname: number
  }
}
