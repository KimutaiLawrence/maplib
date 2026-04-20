export var TileState;
(function (TileState) {
    TileState["Idle"] = "idle";
    TileState["Loading"] = "loading";
    TileState["Loaded"] = "loaded";
    TileState["Error"] = "error";
})(TileState || (TileState = {}));
export class Tile {
    x;
    y;
    z;
    state = TileState.Idle;
    image = null;
    error = null;
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    getKey() {
        return `${this.z}-${this.x}-${this.y}`;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    getZ() {
        return this.z;
    }
    getState() {
        return this.state;
    }
    getImage() {
        return this.image;
    }
    getError() {
        return this.error;
    }
    load(url) {
        if (this.state === TileState.Loading || this.state === TileState.Loaded) {
            return Promise.resolve();
        }
        this.state = TileState.Loading;
        this.image = new Image();
        this.error = null;
        return new Promise((resolve, reject) => {
            this.image.onload = () => {
                this.state = TileState.Loaded;
                resolve();
            };
            this.image.onerror = () => {
                this.state = TileState.Error;
                this.error = 'Failed to load tile';
                reject(new Error(this.error));
            };
            this.image.src = url;
        });
    }
    reset() {
        this.state = TileState.Idle;
        this.image = null;
        this.error = null;
    }
}
//# sourceMappingURL=Tile.js.map