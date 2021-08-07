import BImage from './bImage';

class BModule {
    bImage: BImage;
    x: number;
    y: number;
    x2: number;
    y2: number;

    constructor(bImage: BImage, x?: number | BModule, y?: number) {
        this.bImage = bImage;
        this.x = 0;
        this.y = 0;
        this.x2 = 0;
        this.y2 = 0;

        // init image coordinates
        if (typeof x === 'number' && typeof y === 'number') {
            this.x = x;
            this.y = y;
        } else if (x instanceof BModule) {
            this.setCoordinateFromBModule(x);
        }

        // calculate bottom right coordinates
        if (bImage.image) {
            this.x2 = this.x + bImage.image.width;
            this.y2 = this.y + bImage.image.height;
        }
    }

    setCoordinateFromBModule(fromBModule: BModule) {
        if (this.bImage.relative === undefined) return;
        const relative = this.bImage.relative.get(fromBModule.bImage.name);
        if (relative) {
            this.x = fromBModule.x + relative.x;
            this.y = fromBModule.y + relative.y;
        }
    }

    move(deltaX: number, deltaY: number) {
        this.x += deltaX;
        this.y += deltaY;
    }
}

export default BModule;
