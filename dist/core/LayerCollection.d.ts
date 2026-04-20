import { Layer } from '../layers/Layer';
export declare class LayerCollection {
    private layers;
    private orderedIds;
    addLayer(layer: Layer): void;
    removeLayer(id: string): void;
    getLayer(id: string): Layer | undefined;
    getLayers(): Layer[];
    getLayersOfType(type: string): Layer[];
    hasLayer(id: string): boolean;
    setLayerVisibility(id: string, visible: boolean): void;
    setLayerOpacity(id: string, opacity: number): void;
}
//# sourceMappingURL=LayerCollection.d.ts.map