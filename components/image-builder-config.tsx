import ManifestLayer from '../builder/interfaces/layer';
import { ImageConfig } from '../builder/interfaces/image-config';
import { useState, useEffect } from 'react';

interface Prop {
    layers: ManifestLayer[];
    config: ImageConfig;
    updateConfig(config: ImageConfig): void;
}

interface LayerConfig {
    name: string;
    mode: 'base' | 'match' | 'decorate' | 'repeat';
    number: number;
}

// match
interface BinaryLayerConfig extends LayerConfig {
    number: 0 | 1;
}

// base/repeat
interface UnlimitedLayerConfig extends LayerConfig {
    number: number;
}

// decorate
interface LimitedLayerConfig extends LayerConfig {
    number: number;
    min: number;
    max: number;
}

export default function ImageBuilderConfig({ layers, config, updateConfig }: Prop) {
    const initialConfigs: LayerConfig[] = [];
    for (const layer of layers) {
        let layerConfig = {
            name: layer.name,
            mode: layer.mode ?? 'match',
            number: 0,
        };
        const recommended = config.find((layerConfig) => layerConfig.layerName === layer.name);

        if (layerConfig.mode === 'base' || layerConfig.mode === 'repeat') {
            layerConfig = {
                ...layerConfig,
                number: recommended ? recommended.number : 1,
            } as UnlimitedLayerConfig;
        } else if (layerConfig.mode === 'match') {
            layerConfig = {
                ...layerConfig,
                number: recommended ? recommended.number : 1,
            } as BinaryLayerConfig;
        } else if (layerConfig.mode === 'decorate') {
            layerConfig = {
                ...layerConfig,
                number: recommended ? recommended.number : 1,
                min: 0,
                max: layer.images && Array.isArray(layer.images) ? layer.images.length : 1,
            } as LimitedLayerConfig;
        } else {
            throw new Error(`Can not parse layer config mode ${layerConfig.mode}`);
        }
        initialConfigs.push(layerConfig);
    }
    const [state, setState] = useState({ configs: initialConfigs });

    function updateLayerNumber(event: React.FormEvent<HTMLInputElement>) {
        const configs = [...state.configs];
        const target = event.target as HTMLInputElement;
        const layerName = target.getAttribute('data-layer-name');
        const layerConfig = configs.find((layer) => layer.name === layerName);
        if (layerConfig) layerConfig.number = Number(target.value);
        setState({ configs });
    }

    useEffect(() => {
        const config = [];
        for (const layerConfig of state.configs) {
            config.push({ layerName: layerConfig.name, number: layerConfig.number });
        }
        updateConfig(config);
    }, [updateConfig, state.configs]);

    return (
        <div>
            {state.configs.map((config, i) => (
                <div key={i}>
                    {config.name}
                    <input
                        type="number"
                        data-layer-name={config.name}
                        value={config.number}
                        onChange={updateLayerNumber}
                        min={0}
                    />
                </div>
            ))}
        </div>
    );
}
