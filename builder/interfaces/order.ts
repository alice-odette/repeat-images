export default interface ManifestOrderItem {
    type: 'successive' | 'alternate';
    layers: string[];
}
