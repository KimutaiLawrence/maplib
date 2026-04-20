export declare enum TileState {
    Idle = "idle",
    Loading = "loading",
    Loaded = "loaded",
    Error = "error"
}
export declare class Tile {
    private x;
    private y;
    private z;
    private state;
    private image;
    private error;
    constructor(x: number, y: number, z: number);
    getKey(): string;
    getX(): number;
    getY(): number;
    getZ(): number;
    getState(): TileState;
    getImage(): HTMLImageElement | null;
    getError(): string | null;
    load(url: string): Promise<void>;
    reset(): void;
}
//# sourceMappingURL=Tile.d.ts.map