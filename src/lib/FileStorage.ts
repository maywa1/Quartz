import { defaultShapeUtils, createTLStore } from "tldraw"

export class FileStorage {
  private static async getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
    return navigator.storage.getDirectory()
  }

  static async write(
    path: string,
    content: ArrayBuffer | Blob | string,
  ): Promise<void> {
    const root = await this.getOpfsRoot()
    const parts = path.split('/').filter(Boolean)
    let dir: FileSystemDirectoryHandle = root

    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: true })
    }

    const fileName = parts[parts.length - 1]
    const fileHandle = await dir.getFileHandle(fileName, { create: true })
    const writable = await fileHandle.createWritable()

    try {
      await writable.write(content)
    } finally {
      await writable.close()
    }
  }

  static async read(path: string): Promise<ArrayBuffer> {
    const root = await this.getOpfsRoot()
    const fileHandle = await root.getFileHandle(path)
    const file = await fileHandle.getFile()
    return file.arrayBuffer()
  }

  static async readAsText(path: string): Promise<string> {
    const root = await this.getOpfsRoot()
    const fileHandle = await root.getFileHandle(path)
    const file = await fileHandle.getFile()
    return file.text()
  }

  static async exists(path: string): Promise<boolean> {
    try {
      const root = await this.getOpfsRoot()
      await root.getFileHandle(path)
      return true
    } catch {
      return false
    }
  }

  static async delete(path: string): Promise<void> {
    const root = await this.getOpfsRoot()
    const parts = path.split('/').filter(Boolean)
    let dir: FileSystemDirectoryHandle = root

    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i])
    }

    await dir.removeEntry(parts[parts.length - 1])
  }

  static buildNotePath(id: string): string {
    return `${id}/note.tldr`
  }

  static buildPdfPath(id: string): string {
    return `${id}/document.pdf`
  }

  static buildPath(id: string, fileName: string): string {
    return `${id}/${fileName}`
  }
}

export const DEFAULT_TLDRAW_CONTENT = (() => {
  const store = createTLStore({ shapeUtils: defaultShapeUtils })
  return JSON.stringify(store.getStoreSnapshot())
})()
