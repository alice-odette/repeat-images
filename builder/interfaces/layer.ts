interface ManifestLayer {
    name: string;
    mode?: 'base' | 'match' | 'decorate' | 'repeat';
    fromLayer?: string;
    range?: number[];
    image?: string;
    images?: string[] | ImageRules;
    start?: { layer: string; index: number };
    end?: { layer: string; index: number };
}

interface ImageRules {
    first?: string;
    last?: string;
    remains: string;
}

export default ManifestLayer;
export type { ImageRules };
