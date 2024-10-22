import { CanvasTexture, NearestFilter, RepeatWrapping, Texture, Uniform } from 'three';
import { Effect } from 'postprocessing';

const fragment = `
uniform sampler2D uCharacters;
uniform float uCharactersCount;
uniform float uCellSize;
uniform bool uInvert;

const vec2 SIZE = vec2(16.);

// Convert color to grayscale for ASCII selection
vec3 greyscale(vec3 color) {
    return vec3(dot(color, vec3(0.299, 0.587, 0.114)));
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 cell = resolution / uCellSize;
    vec2 grid = 1.0 / cell;
    vec2 pixelizedUV = grid * (0.5 + floor(uv / grid));
    
    // Get the color from the original scene (vertex colors included)
    vec4 pixelized = texture2D(inputBuffer, pixelizedUV);

    // Convert vertex color to grayscale to choose ASCII character
    float greyscaled = greyscale(pixelized.rgb).r;

    if (uInvert) {
        greyscaled = 1.0 - greyscaled;
    }

    // Find the ASCII character corresponding to brightness
    float characterIndex = floor((uCharactersCount - 1.0) * greyscaled);
    vec2 characterPosition = vec2(mod(characterIndex, SIZE.x), floor(characterIndex / SIZE.y));
    vec2 offset = vec2(characterPosition.x, -characterPosition.y) / SIZE;
    vec2 charUV = mod(uv * (cell / SIZE), 1.0 / SIZE) - vec2(0., 1.0 / SIZE) + offset;
    vec4 asciiCharacter = texture2D(uCharacters, charUV);

    // Apply the ASCII character over the original vertex color
    asciiCharacter.rgb = pixelized.rgb * asciiCharacter.r;
    asciiCharacter.a = pixelized.a;  // Keep original alpha

    outputColor = asciiCharacter;
}
`;

export interface IVertexAsciiEffectProps {
    characters?: string;
    fontSize?: number;
    cellSize?: number;
    invert?: boolean;
}

export class VertexAsciiEffect extends Effect {
    constructor({
        characters = ` .:,'-^=*+?!|0#X%WM@`,
        fontSize = 54,
        cellSize = 16,
        invert = false,
    }: IVertexAsciiEffectProps = {}) {
        const uniforms = new Map<string, Uniform>([
            ['uCharacters', new Uniform(new Texture())],
            ['uCellSize', new Uniform(cellSize)],
            ['uCharactersCount', new Uniform(characters.length)],
            ['uInvert', new Uniform(invert)],
        ]);

        super('VertexAsciiEffect', fragment, { uniforms });

        const charactersTextureUniform = this.uniforms.get('uCharacters');
        if (charactersTextureUniform) {
            charactersTextureUniform.value = this.createCharactersTexture(characters, fontSize);
        }
    }

    /** Creates a texture with ASCII characters */
    public createCharactersTexture(characters: string, fontSize: number): THREE.Texture {
        const canvas = document.createElement('canvas');
        const SIZE = 1024;
        const MAX_PER_ROW = 16;
        const CELL = SIZE / MAX_PER_ROW;

        canvas.width = canvas.height = SIZE;

        const texture = new CanvasTexture(
            canvas,
            undefined,
            RepeatWrapping,
            RepeatWrapping,
            NearestFilter,
            NearestFilter
        );

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Context not available');

        context.clearRect(0, 0, SIZE, SIZE);
        context.font = `${fontSize}px arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#fff';

        for (let i = 0; i < characters.length; i++) {
            const char = characters[i];
            const x = i % MAX_PER_ROW;
            const y = Math.floor(i / MAX_PER_ROW);
            context.fillText(char, x * CELL + CELL / 2, y * CELL + CELL / 2);
        }

        texture.needsUpdate = true;

        return texture;
    }
}
