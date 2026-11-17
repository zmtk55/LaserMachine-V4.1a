// Remove.bg API key - get one free at https://www.remove.bg/api
// Solo por variable de entorno (VITE_REMOVE_BG_API_KEY): una llave escrita
// aquí terminaría en el bundle público que cualquiera puede descargar.
// Sin ella, las llamadas a remove.bg fallan con 403 y removeBackground
// lanza el error correspondiente (ver manejo de errores abajo).
const REMOVE_BG_API_KEY = import.meta.env.VITE_REMOVE_BG_API_KEY || '';

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
        
        let imageBlob: Blob;
        
        if (!imageSrc) {
            throw new Error('No se proporcionó ninguna imagen');
        }
        
        if (imageSrc.startsWith('data:image')) {
            // Parse base64 data URL manually
            imageBlob = dataURLtoBlob(imageSrc);
        } else if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
            // For HTTP URLs, use remove.bg URL endpoint
            return await removeBackgroundFromUrl(imageSrc);
        } else if (imageSrc.startsWith('blob:')) {
            // For blob URLs, fetch the blob
            const response = await fetch(imageSrc);
            imageBlob = await response.blob();
        } else if (imageSrc.startsWith('/')) {
            // For relative URLs (local images like /images/products/...), convert to absolute URL
            const absoluteUrl = window.location.origin + imageSrc;
            return await removeBackgroundFromUrl(absoluteUrl);
        } else if (imageSrc.startsWith('data:')) {
            // It's a data URL but not starting with 'data:image'
            imageBlob = dataURLtoBlob(imageSrc);
        } else {
            // Try to treat it as a URL
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
