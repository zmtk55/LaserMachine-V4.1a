// Remove.bg API key - get one free at https://www.remove.bg/api
// Use environment variable or fallback to hardcoded key
const REMOVE_BG_API_KEY = import.meta.env.VITE_REMOVE_BG_API_KEY || 'zoJ1ti8EduCpRryGhMizuLfY';

// Log which API key is being used (masked for security)
console.log('Remove.bg API Key loaded:', REMOVE_BG_API_KEY ? `${REMOVE_BG_API_KEY.substring(0, 4)}...${REMOVE_BG_API_KEY.substring(REMOVE_BG_API_KEY.length - 4)}` : 'NOT SET');

// Helper function to convert data URL to Blob
function dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

export async function removeBackground(imageSrc: string): Promise<string> {
    try {
        console.log('removeBackground called with:', imageSrc?.substring(0, 50) + '...');
        
        let imageBlob: Blob;
        
        if (!imageSrc) {
            throw new Error('No se proporcionó ninguna imagen');
        }
        
        if (imageSrc.startsWith('data:image')) {
            // Parse base64 data URL manually
            console.log('Processing base64 image...');
            imageBlob = dataURLtoBlob(imageSrc);
            console.log('Blob created:', imageBlob.type, imageBlob.size, 'bytes');
        } else if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
            // For HTTP URLs, use remove.bg URL endpoint
            console.log('Processing URL image...');
            return await removeBackgroundFromUrl(imageSrc);
        } else if (imageSrc.startsWith('blob:')) {
            // For blob URLs, fetch the blob
            console.log('Processing blob URL...');
            const response = await fetch(imageSrc);
            imageBlob = await response.blob();
        } else if (imageSrc.startsWith('/')) {
            // For relative URLs (local images like /images/products/...), convert to absolute URL
            console.log('Processing relative URL:', imageSrc);
            const absoluteUrl = window.location.origin + imageSrc;
            console.log('Converting to absolute URL:', absoluteUrl);
            return await removeBackgroundFromUrl(absoluteUrl);
        } else if (imageSrc.startsWith('data:')) {
            // It's a data URL but not starting with 'data:image'
            console.log('Processing non-standard data URL...');
            imageBlob = dataURLtoBlob(imageSrc);
        } else {
            // Try to treat it as a URL
            console.log('Treating as URL:', imageSrc?.substring(0, 50));
            return await removeBackgroundFromUrl(imageSrc);
        }

        // Create form data
        const formData = new FormData();
        formData.append('image_file', imageBlob, 'image.png');
        formData.append('size', 'auto');

        // Call remove.bg API
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': REMOVE_BG_API_KEY,
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Remove.bg API error:', response.status, errorData);
            
            if (response.status === 402) {
                throw new Error('Créditos de API agotados. Verifica tu cuenta en remove.bg');
            } else if (response.status === 403) {
                throw new Error('API key inválida. Verifica tu clave de remove.bg');
            } else if (response.status === 429) {
                throw new Error('Demasiadas solicitudes. Intenta más tarde.');
            } else if (response.status === 400) {
                throw new Error('Solicitud inválida. Verifica el formato de la imagen.');
            } else if (response.status >= 500) {
                throw new Error('Error del servidor de remove.bg. Intenta más tarde.');
            }
            throw new Error(`Error al remover fondo: ${response.status} - ${errorData.errors?.[0]?.title || 'Error desconocido'}`);
        }

        // Get the result blob
        const resultBlob = await response.blob();
        
        // Create a local URL for the blob
        return URL.createObjectURL(resultBlob);
    } catch (error) {
        console.error('Error in removeBackground:', error);
        throw error;
    }
}

// Alternative function for URL-based images (avoids CORS issues)
async function removeBackgroundFromUrl(imageUrl: string): Promise<string> {
    const formData = new FormData();
    formData.append('image_url', imageUrl);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
            'X-Api-Key': REMOVE_BG_API_KEY,
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Remove.bg API error:', response.status, errorData);
        
        if (response.status === 402) {
            throw new Error('Créditos de API agotados. Verifica tu cuenta en remove.bg');
        } else if (response.status === 403) {
            throw new Error('API key inválida. Verifica tu clave de remove.bg');
        } else if (response.status === 429) {
            throw new Error('Demasiadas solicitudes. Intenta más tarde.');
        } else if (response.status === 400) {
            throw new Error('Solicitud inválida. Verifica el formato de la imagen.');
        } else if (response.status >= 500) {
            throw new Error('Error del servidor de remove.bg. Intenta más tarde.');
        }
        throw new Error(`Error al remover fondo: ${response.status} - ${errorData.errors?.[0]?.title || 'Error desconocido'}`);
    }

    const resultBlob = await response.blob();
    return URL.createObjectURL(resultBlob);
}
