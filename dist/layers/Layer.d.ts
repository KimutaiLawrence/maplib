import { Renderer } from '../core/Renderer';
import { Camera } from '../core/Camera';
import { LayerOptions } from '../types';
export declare abstract class Layer {
    protected id: string;
    protected visible: boolean;
    protected opacity: number;
    constructor(options: LayerOptions);
    getId(): string;
    isVisible(): boolean;
    setVisible(visible: boolean): void;
    getOpacity(): number;
    setOpacity(opacity: number): void;
    abstract getType(): string;
    abstract render(renderer: Renderer, camera: Camera): void;
    onRemove(): void;
}
//# sourceMappingURL=Layer.d.ts.map