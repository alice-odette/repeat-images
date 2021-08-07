import ManifestLayer from './interfaces/layer';
import BModule from './bModule';
import BImage from './bImage';

export interface IImageBuilder {
    readonly baseLayerName: string;
    getImageByName(name: string): BImage;
    resolveLayer(name: string): BModule[];
}

export abstract class LayerBuilder {
    public readonly name: string;
    public abstract readonly isBase: boolean;

    protected constructor(protected readonly ml: ManifestLayer) {
        this.name = ml.name;
    }

    abstract buildLayer(ib: IImageBuilder, n: number): BModule[];

    protected getBImageName(thisIndex: number, totalNumber: number): string {
        if (this.ml.image) {
            return this.ml.image;
        } else if (this.ml.images) {
            if (Array.isArray(this.ml.images)) {
                if (thisIndex < this.ml.images.length) {
                    return this.ml.images[thisIndex];
                } else {
                    return this.ml.images[this.ml.images.length - 1];
                }
            } else if (this.ml.images) {
                if (thisIndex === 0 && this.ml.images.first) {
                    return this.ml.images.first;
                } else if (thisIndex === totalNumber - 1 && this.ml.images.last) {
                    return this.ml.images.last;
                } else {
                    return this.ml.images.remains;
                }
            }
        }
        throw new Error(`can not find image configs for layer ${this.ml.name}`);
    }

    static from(ml: ManifestLayer) {
        switch (ml.mode) {
            case 'base':
                return new BaseLayerBuilder(ml);
            case 'decorate':
                return new DecorateLayerBuilder(ml);
            case 'repeat':
                return new RepeatLayerBuilder(ml);
            default:
                return new MatchLayerBuilder(ml);
        }
    }
}

class BaseLayerBuilder extends LayerBuilder {
    public isBase = true;
    buildLayer(ib: IImageBuilder, number: number): BModule[] {
        const firstBImageName = this.getBImageName(0, number);
        const layer: BModule[] = [new BModule(ib.getImageByName(firstBImageName))];

        for (let i = 1; i < number; i++) {
            const thisBImageName = this.getBImageName(i, number);
            layer.push(new BModule(ib.getImageByName(thisBImageName), layer[i - 1]));
        }

        return layer;
    }
}

abstract class DependentLayerBuilder extends LayerBuilder {
    public isBase = false;
    protected range: number[];
    protected dependentLayerName?: string;
    constructor(ml: ManifestLayer) {
        super(ml);
        this.dependentLayerName = ml.fromLayer;
        this.range = ml.range ? ml.range : [];
    }

    protected getDependentLayerName(ib: IImageBuilder): string {
        if (this.dependentLayerName) {
            return this.dependentLayerName;
        } else {
            return ib.baseLayerName;
        }
    }
    protected getDependentLayer(ib: IImageBuilder) {
        return ib.resolveLayer(this.getDependentLayerName(ib));
    }

    protected getDependentLayerIndices(ib: IImageBuilder) {
        const fromLayer = this.getDependentLayer(ib);
        if (this.range.length === 0) {
            return [0, fromLayer.length];
        } else if (this.range.length === 1) {
            const fromIndex = this.getIndex(ib, this.range[0]);
            return [fromIndex, fromIndex + 1];
        } else {
            const fromIndex = this.getIndex(ib, this.range[0]);
            const toIndex = this.getIndex(ib, this.range[1]);
            return [fromIndex, toIndex];
        }
    }

    protected getIndex(ib: IImageBuilder, index: number) {
        const fromLayer = this.getDependentLayer(ib);
        if (index < 0) {
            return fromLayer.length + index;
        } else {
            return index;
        }
    }
}

class MatchLayerBuilder extends DependentLayerBuilder {
    buildLayer(ib: IImageBuilder, number: number): BModule[] {
        if (number === 0) return [];
        const layer: BModule[] = [];

        const [start, end] = this.getDependentLayerIndices(ib);
        const fromLayer = this.getDependentLayer(ib);

        for (let fromIndex = start; fromIndex < end; fromIndex++) {
            const thisBModuleName = this.getBImageName(0, number);
            const thisBModule = new BModule(
                ib.getImageByName(thisBModuleName),
                fromLayer[fromIndex]
            );
            layer.push(thisBModule);
        }
        return layer;
    }
}

class DecorateLayerBuilder extends DependentLayerBuilder {
    buildLayer(ib: IImageBuilder, number: number): BModule[] {
        const layer: BModule[] = [];

        const [start, end] = this.getDependentLayerIndices(ib);
        const fromLayer = this.getDependentLayer(ib);

        for (let fromIndex = start; fromIndex < end; fromIndex++) {
            if (Array.isArray(this.ml.images)) {
                if (number === -1 || number > this.ml.images.length) {
                    number = this.ml.images.length - 1;
                }
            } else {
                number = 1;
            }

            for (let i = 0; i < number; i++) {
                const thisBModuleName = this.getBImageName(i, number);
                const thisBModule = new BModule(
                    ib.getImageByName(thisBModuleName),
                    fromLayer[fromIndex]
                );
                layer.push(thisBModule);
            }
        }
        return layer;
    }
}

class RepeatLayerBuilder extends DependentLayerBuilder {
    start?: { layer: string; index: number };
    end?: { layer: string; index: number };

    constructor(ml: ManifestLayer) {
        super(ml);
        this.start = ml.start;
        this.end = ml.end;
    }
    buildLayer(ib: IImageBuilder, number: number): BModule[] {
        const layer: BModule[] = [];

        const fromLayer = this.getDependentLayer(ib);
        if (!this.start || !this.end) {
            throw new Error(`can not find start or end config for ${this.ml.name}`);
        }
        if (!this.ml.image) {
            throw new Error(`can not find image for ${this.ml.name}`);
        }
        const bImage = ib.getImageByName(this.ml.image);

        const startMatchBModule = fromLayer[this.getIndex(ib, this.start.index)];
        const endMatchBModule = fromLayer[this.getIndex(ib, this.end.index)];

        const startBModule = new BModule(bImage, startMatchBModule);
        const endBModule = new BModule(bImage, endMatchBModule);

        layer.push(startBModule);

        const xDelta = (endBModule.x - startBModule.x) / (number - 1);
        const yDelta = (endBModule.y - startBModule.y) / (number - 1);

        for (let i = 1; i < number; i++) {
            const bModule = new BModule(bImage, startMatchBModule);
            bModule.move(xDelta * i, yDelta * i);
            layer.push(bModule);
        }

        return layer;
    }
}
