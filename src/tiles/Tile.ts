import { TileCoord } from '../types'

export enum TileState {
  Idle = 'idle',
  Loading = 'loading',
  Loaded = 'loaded',
  Error = 'error'
}

export class Tile {
  private x: number
  private y: number
  private z: number
  private state: TileState = TileState.Idle
  private image: HTMLImageElement | null = null
  private error: string | null = null

  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }

  getKey(): string {
    return `${this.z}-${this.x}-${this.y}`
  }

  getX(): number {
    return this.x
  }

  getY(): number {
    return this.y
  }

  getZ(): number {
    return this.z
  }

  getState(): TileState {
    return this.state
  }

  getImage(): HTMLImageElement | null {
    return this.image
  }

  getError(): string | null {
    return this.error
  }

  load(url: string): Promise<void> {
    if (this.state === TileState.Loading || this.state === TileState.Loaded) {
      return Promise.resolve()
    }

    this.state = TileState.Loading
    this.image = new Image()
    this.error = null

    return new Promise((resolve, reject) => {
      this.image!.onload = () => {
        this.state = TileState.Loaded
        resolve()
      }
      
      this.image!.onerror = () => {
        this.state = TileState.Error
        this.error = 'Failed to load tile'
        reject(new Error(this.error))
      }

      this.image!.src = url
    })
  }

  reset(): void {
    this.state = TileState.Idle
    this.image = null
    this.error = null
  }
}