import ManifestImage from './interfaces/image';
import JSZip from 'jszip';

class BImage {
    name: string;
    src: string;
    relative?: Map<string, { x: number; y: number }>;
    image?: HTMLImageElement;

    constructor({ name, src, relative }: ManifestImage) {
        this.name = name;
        this.src = src;
        if (relative) {
            this.relative = new Map(Object.entries(relative));
        }
    }

    async loadImage(zip: JSZip) {
        const blob = await zip.files[this.src].async('blob');
        this.image = new Image();
        this.image.src = URL.createObjectURL(blob);
    }
}

export default BImage;
