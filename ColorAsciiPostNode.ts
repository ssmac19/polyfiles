import { TypedPostNode, TypedPostNodeContext, PostParamOptions } from '@polygonjs/polygonjs/dist/src/engine/nodes/post/_Base';
import { NodeParamsConfig, ParamConfig } from '@polygonjs/polygonjs/dist/src/engine/nodes/utils/params/ParamsConfig';
import { EffectPass } from 'postprocessing';
import { ColorAsciiEffect } from './ColorAsciiEffect';

class ColorAsciiPostParamsConfig extends NodeParamsConfig {
    characters = ParamConfig.STRING(` .:,'-^=*+?!|0#X%WM@`, {
        ...PostParamOptions,
    });

    fontSize = ParamConfig.INTEGER(54, {
        range: [10, 100],  // Adjust the range as needed
        rangeLocked: [true, false],
        ...PostParamOptions,
    });

    cellSize = ParamConfig.INTEGER(16, {
        range: [1, 100],
        rangeLocked: [true, false],
        ...PostParamOptions,
    });

    color = ParamConfig.COLOR([1, 1, 1], {
        ...PostParamOptions,
    });
}
const ParamsConfig = new ColorAsciiPostParamsConfig();

export class ColorAsciiPostNode extends TypedPostNode<EffectPass, ColorAsciiPostParamsConfig> {
    override paramsConfig = ParamsConfig;
    static override type() {
        return 'colorAscii';
    }

    override createPass(context: TypedPostNodeContext) {
        const effect = new ColorAsciiEffect({
            characters: this.pv.characters,   // Use dynamic parameter
            fontSize: this.pv.fontSize,       // Use dynamic parameter
            cellSize: this.pv.cellSize,       // Use dynamic parameter
            color: this.pv.color.toString(),  // Use dynamic parameter
        });
        const pass = new EffectPass(context.camera, effect);
        this.updatePass(pass);
        return pass;
    }

    override updatePass(pass: EffectPass) {
        // Dynamically update parameters whenever they are changed
        const effect = (pass as any).effects[0] as ColorAsciiEffect;
        effect.uniforms.get('uCharacters')!.value = this.pv.characters;
        effect.uniforms.get('uCellSize')!.value = this.pv.cellSize;
        effect.uniforms.get('uColor')!.value.set(this.pv.color.toString());

        // If the fontSize or characters change, we need to recreate the texture
        effect.uniforms.get('uCharacters')!.value = effect.createCharactersTexture(this.pv.characters, this.pv.fontSize);
    }
}



///based off:
///https://github.com/polygonjs/polygonjs-plugin-post-ascii
///https://github.com/mrdoob/three.js/blob/master/examples/jsm/effects/AsciiEffect.js
///https://github.com/emilwidlund/ASCII/blob/main/src/index.ts