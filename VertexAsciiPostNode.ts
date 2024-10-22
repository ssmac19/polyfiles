import { TypedPostNode, TypedPostNodeContext, PostParamOptions } from '@polygonjs/polygonjs/dist/src/engine/nodes/post/_Base';
import { NodeParamsConfig, ParamConfig } from '@polygonjs/polygonjs/dist/src/engine/nodes/utils/params/ParamsConfig';
import { EffectPass } from 'postprocessing';
import { VertexAsciiEffect } from './VertexAsciiEffect';

class VertexAsciiPostParamsConfig extends NodeParamsConfig {
    characters = ParamConfig.STRING(` .:,'-^=*+?!|0#X%WM@`, { ...PostParamOptions });
    fontSize = ParamConfig.INTEGER(54, { range: [10, 100], rangeLocked: [true, false], ...PostParamOptions });
    cellSize = ParamConfig.INTEGER(16, { range: [1, 100], rangeLocked: [true, false], ...PostParamOptions });
}
const ParamsConfig = new VertexAsciiPostParamsConfig();

export class VertexAsciiPostNode extends TypedPostNode<EffectPass, VertexAsciiPostParamsConfig> {
    override paramsConfig = ParamsConfig;
    static override type() {
        return 'vertexAscii';
    }

    override createPass(context: TypedPostNodeContext) {
        const effect = new VertexAsciiEffect({
            characters: this.pv.characters,
            fontSize: this.pv.fontSize,
            cellSize: this.pv.cellSize,
        });
        const pass = new EffectPass(context.camera, effect);
        this.updatePass(pass);
        return pass;
    }

    override updatePass(pass: EffectPass) {
        const effect = (pass as any).effects[0] as VertexAsciiEffect;
        effect.uniforms.get('uCharacters')!.value = this.pv.characters;
        effect.uniforms.get('uCellSize')!.value = this.pv.cellSize;
        effect.uniforms.get('uCharacters')!.value = effect.createCharactersTexture(this.pv.characters, this.pv.fontSize);
    }
}
