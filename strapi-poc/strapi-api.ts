// strapi-poc/strapi-api.ts
// Cliente API para consumir Strapi desde React

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = import.meta.env.VITE_STRAPI_API_TOKEN;

interface StrapiResponse<T> {
  data: T[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
    };
  };
}

interface StrapiTemplate {
  id: number;
  attributes: {
    name: string;
    occasion: string;
    texts: Array<{
      content: string;
      fontFamily: string;
      size: number;
      yPosition: number;
      rotation: number;
    }>;
    previewImage?: {
      data?: {
        attributes: {
          url: string;
          formats: {
            thumbnail?: { url: string };
            small?: { url: string };
          };
        };
      };
    };
    tags?: {
      data: Array<{
        id: number;
        attributes: { name: string };
      }>;
    };
    isActive: boolean;
    isFavorite: boolean;
    usageCount: number;
    createdAt: string;
    updatedAt: string;
  };
}

// Cliente base
const fetchStrapi = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<StrapiResponse<T>> => {
  const url = `${STRAPI_URL}/api${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Strapi API error: ${response.statusText}`);
  }

  return response.json();
};

// ==================== TEMPLATES API ====================

export const getTemplates = async (filters?: {
  occasion?: string;
  search?: string;
  isActive?: boolean;
  isFavorite?: boolean;
  tag?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<StrapiResponse<StrapiTemplate>> => {
  const params = new URLSearchParams();
  
  // Siempre poblar relaciones
  params.append('populate', '*');
  
  if (filters?.occasion) {
    params.append('filters[occasion][$eq]', filters.occasion);
  }
  
  if (filters?.search) {
    params.append('filters[name][$containsi]', filters.search);
  }
  
  if (filters?.isActive !== undefined) {
    params.append('filters[isActive][$eq]', String(filters.isActive));
  }
  
  if (filters?.isFavorite !== undefined) {
    params.append('filters[isFavorite][$eq]', String(filters.isFavorite));
  }
  
  if (filters?.tag) {
    params.append('filters[tags][name][$eq]', filters.tag);
  }
  
  if (filters?.sort) {
    params.append('sort[0]', filters.sort);
  }
  
  if (filters?.page) {
    params.append('pagination[page]', String(filters.page));
    params.append('pagination[pageSize]', String(filters.pageSize || 20));
  }

  return fetchStrapi<StrapiTemplate>(`/templates?${params.toString()}`);
};

export const getTemplateById = async (id: number): Promise<StrapiTemplate> => {
  const response = await fetchStrapi<StrapiTemplate>(`/templates/${id}?populate=*`);
  return response.data[0];
};

export const createTemplate = async (data: Partial<StrapiTemplate['attributes']>) => {
  return fetchStrapi<StrapiTemplate>('/templates', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
};

export const updateTemplate = async (
  id: number,
  data: Partial<StrapiTemplate['attributes']>
) => {
  return fetchStrapi<StrapiTemplate>(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
};

export const deleteTemplate = async (id: number) => {
  return fetch(`/templates/${id}`, { method: 'DELETE' });
};

// Incrementar contador de uso
export const incrementUsage = async (id: number, currentCount: number) => {
  return updateTemplate(id, { usageCount: currentCount + 1 });
};

// Toggle favorito
export const toggleFavorite = async (id: number, isFavorite: boolean) => {
  return updateTemplate(id, { isFavorite: !isFavorite });
};

// ==================== TAGS API ====================

export const getTags = async () => {
  return fetchStrapi('/tags');
};

export const createTag = async (name: string) => {
  return fetchStrapi('/tags', {
    method: 'POST',
    body: JSON.stringify({ data: { name } }),
  });
};

// ==================== UPLOAD ====================

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('files', file);

  const response = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: {
      ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data[0].id; // Retorna el ID para asociar al template
};

// ==================== ADAPTADOR A TU APP ====================

// Convierte respuesta Strapi a tu tipo DesignTemplate actual
export const adaptStrapiToTemplate = (
  strapiTemplate: StrapiTemplate
): import('../types').DesignTemplate => {
  const { id, attributes } = strapiTemplate;
  
  return {
    id: String(id),
    name: attributes.name,
    occasion: attributes.occasion as any,
    texts: attributes.texts.map(t => ({
      content: t.content,
      fontFamily: t.fontFamily,
      size: t.size,
      yPosition: t.yPosition,
      rotation: t.rotation,
    })),
    preview: '',
    previewImage: attributes.previewImage?.data?.attributes.url,
    isActive: attributes.isActive,
    isFavorite: attributes.isFavorite,
    usageCount: attributes.usageCount,
    createdAt: attributes.createdAt,
    tags: attributes.tags?.data.map(t => t.attributes.name) || [],
  };
};

// Hook de ejemplo para React Query / SWR
/*
import useSWR from 'swr';

export const useTemplates = (filters?: Parameters<typeof getTemplates>[0]) => {
  const { data, error, isLoading } = useSWR(
    ['templates', filters],
    () => getTemplates(filters).then(r => r.data.map(adaptStrapiToTemplate))
  );
  
  return {
    templates: data || [],
    isLoading,
    error,
  };
};
*/
