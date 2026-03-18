// Free AI Image Generation Service using Hugging Face
// Uses Stable Diffusion XL for image generation - FREE with Hugging Face

// Get free API key from https://huggingface.co/settings/tokens
const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || '';
const HF_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// Generate image from text prompt using Hugging Face (FREE)
export async function generateImageFromPrompt(prompt: string): Promise<GenerateImageResponse> {
  try {
    if (!HF_API_KEY) {
      // Return mock response for demo purposes when no API key
      console.log('Hugging Face API key not set. Using demo mode.');
      return {
        success: true,
        imageUrl: `https://placehold.co/512x512/f59e0b/ffffff?text=${encodeURIComponent(prompt.slice(0, 20))}`
      };
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            negative_prompt: 'low quality, blurry, text, watermark',
            guidance_scale: 7.5,
            num_inference_steps: 30
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Error generating image');
    }

    // Response is a blob/image
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    
    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    console.error('Error generating image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate logo/monogram design with AI
export async function generateLogo(prompt: string): Promise<GenerateImageResponse> {
  const fullPrompt = `Minimalist logo design for laser engraving on drinkware: ${prompt}. Black and white, vector style, clean lines, suitable for engraving on metal. No gradients, no colors.`;
  
  return generateImageFromPrompt(fullPrompt);
}

// Generate monogram with AI
export async function generateMonogram(text: string, style: string): Promise<GenerateImageResponse> {
  const prompt = `Elegant monogram letters "${text}" in ${style} style. Professional logo design, black and white, clean vector style, suitable for laser engraving on stainless steel tumbler. Minimalist design with decorative elements.`;
  
  return generateImageFromPrompt(prompt);
}

// Generate decorative element
export async function generateDecoration(prompt: string): Promise<GenerateImageResponse> {
  const fullPrompt = `Decorative border or ornament for laser engraving: ${prompt}. Black and white, clean vector lines, suitable for engraving on drinkware. Minimalist style.`;
  
  return generateImageFromPrompt(fullPrompt);
}

// Generate template design
export async function generateTemplate(templateType: string, theme: string): Promise<GenerateImageResponse> {
  const prompts: Record<string, string> = {
    'sports': `${theme} sports team emblem logo, bold athletic style, black and white, suitable for engraving`,
    'western': `${theme} western cowboy badge design, vintage style, black and white, suitable for engraving`,
    'vintage': `${theme} vintage Art Deco design, elegant classic style, black and white, suitable for engraving`,
    'nature': `${theme} nature inspired design, botanical elements, black and white, suitable for engraving`,
    'minimal': `${theme} minimalist modern logo, clean lines, black and white, suitable for engraving`,
    'script': `${theme} elegant script monogram, cursive lettering, black and white, suitable for engraving`
  };
  
  const prompt = prompts[templateType] || `${theme} logo design for laser engraving, black and white`;
  
  return generateImageFromPrompt(prompt);
}

// Alternative: Use Stability AI via Replicate (also has free tier)
export async function generateWithStabilityAI(prompt: string): Promise<GenerateImageResponse> {
  // This would require Replicate API key
  // For now, fallback to Hugging Face
  return generateImageFromPrompt(prompt);
}
