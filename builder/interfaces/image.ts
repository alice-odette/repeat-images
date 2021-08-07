export default interface ManifestImage {
    name: string;
    src: string;
    relative?: Map<string, { x: number; y: number }>;
}
