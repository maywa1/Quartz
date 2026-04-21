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
    const parts = path.split('/').filter(Boolean)

    if (parts.length === 1) {
      const fileHandle = await root.getFileHandle(parts[0])
      const file = await fileHandle.getFile()
      return file.arrayBuffer()
    }

    let dir: FileSystemDirectoryHandle = root
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i])
    }

    const fileName = parts[parts.length - 1]
    const fileHandle = await dir.getFileHandle(fileName)
    const file = await fileHandle.getFile()
    return file.arrayBuffer()
  }

  static async readAsText(path: string): Promise<string> {
    const root = await this.getOpfsRoot()
    const parts = path.split('/').filter(Boolean)

    if (parts.length === 1) {
      const fileHandle = await root.getFileHandle(parts[0])
      const file = await fileHandle.getFile()
      return file.text()
    }

    let dir: FileSystemDirectoryHandle = root
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i])
    }

    const fileName = parts[parts.length - 1]
    const fileHandle = await dir.getFileHandle(fileName)
    const file = await fileHandle.getFile()
    return file.text()
  }

  static async exists(path: string): Promise<boolean> {
    try {
      const root = await this.getOpfsRoot()
      const parts = path.split('/').filter(Boolean)

      if (parts.length === 1) {
        await root.getFileHandle(parts[0])
        return true
      }

      let dir: FileSystemDirectoryHandle = root
      for (let i = 0; i < parts.length - 1; i++) {
        dir = await dir.getDirectoryHandle(parts[i])
      }

      await dir.getFileHandle(parts[parts.length - 1])
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

  static async deleteDir(path: string): Promise<void> {
    const root = await this.getOpfsRoot()
    const parts = path.split('/').filter(Boolean)

    if (parts.length === 1) {
      await root.removeEntry(parts[0], { recursive: true })
      return
    }

    let dir: FileSystemDirectoryHandle = root
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i])
    }

    await dir.removeEntry(parts[parts.length - 1], { recursive: true })
  }
  static buildPdfPath(id: string): string {
    return `pdfs/${id}/document.pdf`
  }

  static buildNotePath(id: string): string {
    return `notes/${id}/drawing.excalidraw`
  }
}
