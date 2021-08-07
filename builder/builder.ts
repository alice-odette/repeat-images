import Manifest from './interfaces/manifest';
import BImage from './bImage';
import BModule from './bModule';
import { LayerBuilder } from './layerBuilder';
import ImageSource from './image-source';
import { ImageConfig, ImageConfigMap } from './interfaces/image-config';

class ImageBuilder {
    baseLayerName: string;
    private layerBuilders: Map<string, LayerBuilder>;
    private layers: Map<string, BModule[]>;
    private config: ImageConfigMap;

    constructor(
        private readonly iSrc: ImageSource,
        private readonly manifest: Manifest,
        imageBuilderConfig: ImageConfig
    ) {
        this.manifest = manifest;

        // layers
        this.layerBuilders = new Map<string, LayerBuilder>();
        this.baseLayerName = '';
        for (const layer of this.manifest.layers) {
            const layerBuilder = LayerBuilder.from(layer);
            this.layerBuilders.set(layerBuilder.name, layerBuilder);
            if (!this.baseLayerName && layer.mode === 'base') {
                this.baseLayerName = layerBuilder.name;
            }
        }

        if (!this.baseLayerName) {
            throw new Error('can not find base layer');
        }

        this.layers = new Map();
        this.config = new Map();

        for (const entry of imageBuilderConfig) {
            this.config.set(entry.layerName, entry);
        }
    }

    getImageByName(name: string): BImage {
        return this.iSrc.getImageByName(name);
    }

    resolveLayer(name: string): BModule[] {
        const entry = this.config.get(name);
        if (!entry) throw new Error(`Cannot find config for ${name}`);
        const builder = this.layerBuilders.get(name);
        if (!builder) throw new Error(`Cannot find layer builder for ${name}`);
        const cached = this.layers.get(name);
        if (cached) return cached;
        const result = builder.buildLayer(this, entry.number);
        this.layers.set(name, result);
        return result;
    }

    draw(canvas: HTMLCanvasElement) {
        this.resolveLayer(this.baseLayerName);
        for (const l of this.config.keys()) this.resolveLayer(l);

        const [width, height] = this.calculateImageSize();
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        this.drawLayerImpl(ctx);
    }

    private calculateImageSize() {
        let ix = 0,
            iy = 0,
            ax = 0,
            ay = 0;
        for (const layer of this.layers.values()) {
            for (const bModule of layer) {
                ix = Math.min(ix, bModule.x);
                iy = Math.min(iy, bModule.y);
                ax = Math.max(ax, bModule.x2);
                ay = Math.max(ay, bModule.y2);
            }
        }
        for (const layer of this.layers.values()) {
            for (const bModule of layer) {
                bModule.move(-ix, -iy);
            }
        }

        return [ax - ix, ay - iy];
    }

    private drawLayerImpl(ctx: CanvasRenderingContext2D) {
        for (const group of this.manifest.order) {
            if (group.type == 'successive') {
                for (const layerName of group.layers) {
                    const layer = this.layers.get(layerName);
                    if (!layer) continue;
                    for (const bModule of layer) {
                        if (!bModule.bImage.image) continue;
                        ctx.drawImage(bModule.bImage.image, bModule.x, bModule.y);
                    }
                }
            } else if (group.type === 'alternate') {
                const firstLayer = this.layers.get(group.layers[0]);
                if (firstLayer) {
                    for (let i = 0; i < firstLayer.length; i++) {
                        for (const layerName of group.layers) {
                            const layer = this.layers.get(layerName);
                            if (!layer || layer.length <= i) continue;
                            const bModule = layer[i];
                            if (!bModule.bImage.image) continue;
                            ctx.drawImage(bModule.bImage.image, bModule.x, bModule.y);
                        }
                    }
                }
            }
        }
    }
}

export default ImageBuilder;
export type { Manifest as BuilderManifest };
