import ManifestImage from './image';
import ManifestLayer from './layer';
import ManifestOrderItem from './order';

export default interface Manifest {
    images: ManifestImage[];
    layers: ManifestLayer[];
    order: ManifestOrderItem[];
}
