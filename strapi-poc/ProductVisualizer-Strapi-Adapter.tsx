// strapi-poc/ProductVisualizer-Strapi-Adapter.tsx
// Ejemplo de cómo adaptar tu ProductVisualizer actual

import React from 'react';
import { useStrapiProduct, useStrapiFonts, incrementTemplateUsage } from './useStrapiProduct';
import { DesignTemplatesStrapi } from './DesignTemplates-Strapi';
// ... tus otros imports

interface Props {
  productId: string; // Ahora recibes ID en lugar del objeto completo
  // ... resto de props
}

export const ProductVisualizerStrapi: React.FC<Props> = ({ productId, ...props }) => {
  // 1. Cargar producto y templates desde Strapi
  const { product, templates, isLoading: productLoading } = useStrapiProduct(productId);
  
  // 2. Cargar fuentes desde Strapi
  const { fonts, isLoading: fontsLoading } = useStrapiFonts();

  // 3. Estados locales (iguales que antes)
  const [selectedColor, setSelectedColor] = React.useState('');
  const [frontText, setFrontText] = React.useState('');
  const [frontFontId, setFrontFontId] = React.useState(1);
  // ... etc

  // 4. Inicializar color cuando carga el producto
  React.useEffect(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0].name);
    }
  }, [product]);

  // 5. Manejar selección de template
  const handleApplyTemplate = async (template: DesignTemplate) => {
    // Incrementar contador en Strapi
    await incrementTemplateUsage(template.id);
    
    // Aplicar a tu estado local (igual que antes)
    if (template.texts.length > 0) {
      const text1 = template.texts[0];
      setFrontText(typeof text1 === 'string' ? text1 : text1.content);
      
      // Buscar ID de fuente
      const font = fonts.find(f => 
        f.name === (typeof text1 === 'string' ? 'Bebas Neue' : text1.fontFamily)
      );
      setFrontFontId(font?.id || 1);
      
      // ... resto de lógica de aplicar template
    }
  };

  // Loading state
  if (productLoading || fontsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!product) {
    return <div>Producto no encontrado</div>;
  }

  return (
    <div className="product-visualizer">
      {/* Header con info del producto */}
      <div className="product-header">
        <h1>{product.name}</h1>
        <p className="text-zinc-400">{product.description}</p>
        <div className="text-2xl font-bold text-yellow-400">
          ${product.price}
        </div>
      </div>

      {/* Selector de colores desde Strapi */}
      <div className="color-selector">
        {product.colors.map(color => (
          <button
            key={color.name}
            onClick={() => setSelectedColor(color.name)}
            className={`color-option ${selectedColor === color.name ? 'active' : ''}`}
            style={{ backgroundColor: color.hex }}
            title={`${color.name} ${color.priceModifier ? `(+$${color.priceModifier})` : ''}`}
          />
        ))}
      </div>

      {/* Canvas de personalización (tu código existente) */}
      {/* Pero ahora usa fonts cargados desde Strapi */}
      
      {/* Modal de templates - versión Strapi */}
      {showTemplates && (
        <DesignTemplatesStrapi
          onSelectTemplate={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Editor de texto con fuentes de Strapi */}
      <select 
        value={frontFontId}
        onChange={(e) => setFrontFontId(Number(e.target.value))}
      >
        {fonts.map(font => (
          <option key={font.id} value={font.id}>
            {font.name}
          </option>
        ))}
      </select>
    </div>
  );
};

// INSTRUCCIONES DE IMPLEMENTACIÓN:

/*
1. INSTALAR DEPENDENCIAS (si no las tienes):
   npm install swr  // o react-query para caching

2. CREAR .env.local:
   VITE_STRAPI_URL=http://localhost:1337
   VITE_STRAPI_API_TOKEN=tu_token_aqui

3. COPIAR ARCHIVOS:
   - strapi-poc/useStrapiProduct.ts → src/hooks/useStrapiProduct.ts
   - strapi-poc/DesignTemplates-Strapi.tsx → src/components/DesignTemplatesStrapi.tsx

4. MODIFICAR TU RUTA/App.tsx:
   
   // Antes
   <Route path="/product/:id" element={<ProductVisualizer product={PRODUCTS.find(p => p.id === id)} />} />
   
   // Después
   <Route path="/product/:id" element={<ProductVisualizerStrapi productId={id} />} />

5. PROBAR:
   - Iniciar Strapi: npm run develop (en carpeta laser-cms)
   - Crear 1 producto de prueba en http://localhost:1337/admin
   - Ver que carga en tu app React

6. MIGRACIÓN GRADUAL:
   - Mantén tus PRODUCTS actuales como fallback
   - Si useStrapiProduct falla, usar datos locales
   - Cuando todo funcione, quitar fallback

FALLBACK OPCIONAL:

const { product: strapiProduct, isLoading } = useStrapiProduct(id);
const product = strapiProduct || PRODUCTS.find(p => p.id === id);

Esto permite que funcione mientras migras.
*/

export default ProductVisualizerStrapi;
