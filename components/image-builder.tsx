import { createRef, useEffect, useState } from 'react';
import Builder, { BuilderManifest } from '../builder/builder';
import ImageSource from '../builder/image-source';
import { ImageConfig } from '../builder/interfaces/image-config';
import ImageBuilderConfig from './image-builder-config';
import JSZip from 'jszip';

interface State {
    config: ImageConfig;
    imageSource?: ImageSource;
    manifest?: BuilderManifest;
    loaded: boolean;
}

export default function ImageBuilder() {
    const [state, setState] = useState<State>({
        loaded: false,
        config: [],
    });
    const refCanvas = createRef<HTMLCanvasElement>();

    const resourceChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length) {
            setState({ loaded: false, config: [] });
            const zip = await JSZip.loadAsync(event.target.files[0]);
            const manifest = JSON.parse(
                await zip.files['manifest.json'].async('string')
            ) as BuilderManifest;
            const config = JSON.parse(
                await zip.files['recomends.json'].async('string')
            ) as ImageConfig;
            const imageSource = new ImageSource(manifest, zip);
            await imageSource.loadAll();
            setState({ config, imageSource, manifest, loaded: true });
        }
    };

    useEffect(() => {
        if (state.imageSource && state.manifest) {
            const builder = new Builder(state.imageSource, state.manifest, state.config);

            if (refCanvas.current) {
                builder.draw(refCanvas.current);
            }
        }
    }, [refCanvas, state.imageSource, state.manifest, state.config]);

    function updateConfig(config: ImageConfig) {
        setState({ ...state, config });
    }

    return (
        <div>
            <input type="file" onChange={resourceChosen} />
            {state.manifest && (
                <ImageBuilderConfig
                    layers={state.manifest.layers}
                    config={state.config}
                    updateConfig={updateConfig}
                />
            )}
            <canvas ref={refCanvas} style={{ width: '100%' }} />
        </div>
    );
}
