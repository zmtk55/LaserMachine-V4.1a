// AI Image Generation Service
// Uses DALL-E 3 for image generation from text prompts

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const DALL_E_MODEL = 'dall-e-3';
const DALL_E_SIZE = '1024x1024';

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Generate image from text prompt using DALL-E
export async function generateImageFromPrompt(prompt: string): Promise<GenerateImageResponse> {
  try {
    if (!OPENAI_API_KEY) {
      // Fallback: return a placeholder message
      return {
        success: false,
        error: 'API key no configurada. Usa VITE_OPENAI_API_KEY en .env.local'
      };
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: DALL_E_MODEL,
        prompt: prompt,
        size: DALL_E_SIZE,
        n: 1,
        quality: 'standard'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Error generating image');
    }

    const data = await response.json();
    
    return {
      success: true,
      imageUrl: data.data[0].url
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate logo design from description
export async function generateLogo(prompt: string, style?: string): Promise<GenerateImageResponse> {
  const fullPrompt = `Create a minimalist logo design for laser engraving: ${prompt}. ${style || 'Modern, clean, vector-style'}. Black and white only, suitable for engraving on metal or plastic surfaces.`;
  
  return generateImageFromPrompt(fullPrompt);
}

// Generate monogram design
export async function generateMonogram(text: string, style: string): Promise<GenerateImageResponse> {
  const styleDescriptions: Record<string, string> = {
    'minimal': 'Simple, clean, single-line minimal letters',
    'script': 'Elegant cursive script letters',
    'vintage': 'Classic vintage Victorian style letters',
    'sports': 'Bold athletic sports letter style',
    'western': 'Western cowboy style letters',
    'floral': 'Letters decorated with floral botanical elements'
  };
  
  const styleDesc = styleDescriptions[style] || styleDescriptions['minimal'];
  const prompt = `Create monogram letters "${text.toUpperCase()}" in ${styleDesc}. Black and white, vector-style, suitable for laser engraving.`;
  
  return generateImageFromPrompt(prompt);
}

// Generate decorative element
export async function generateDecoration(prompt: string): Promise<GenerateImageResponse> {
  const fullPrompt = `Create decorative border or ornament design: ${prompt}. Black and white, clean lines, vector-style, suitable for laser engraving on drinkware.`;
  
  return generateImageFromPrompt(fullPrompt);
}
