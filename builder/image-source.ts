import Manifest from './interfaces/manifest';
import BImage from './bImage';
import JSZip from 'jszip';

export default class ImageSource {
    private images: BImage[];
    private zip: JSZip;

    constructor(manifest: Manifest, zip: JSZip) {
        this.images = [];
        for (const image of manifest.images) {
            const bImage = new BImage(image);
            this.images.push(bImage);
        }
        this.zip = zip;
    }

    loadAll() {
        const loadingPromises: Promise<void>[] = [];
        for (const image of this.images) {
            loadingPromises.push(image.loadImage(this.zip));
        }
        return Promise.all(loadingPromises);
    }

    getImageByName(name: string): BImage {
        const bImage = this.images.find((i) => i.name === name);
        if (bImage) {
            return bImage;
        } else {
            throw new Error(`can not find image with name "${name}"`);
        }
    }
}
