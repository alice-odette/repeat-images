export interface LayerConfig {
    layerName: string;
    number: number;
}

export type ImageConfig = ReadonlyArray<LayerConfig>;

export type ImageConfigMap = Map<string, LayerConfig>;
