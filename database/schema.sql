-- ============================================================
-- LASERMACHINE DATABASE SCHEMA
-- PostgreSQL para Neon
-- ============================================================
-- Organizado por dominios de negocio:
--   1. System Setup
--   2. Catálogo (Products, Fonts)
--   3. Clientes (Customers)
--   4. Transacciones (Orders, Items)
--   5. Marketing (Coupons, Points)
--   6. Configuración (Store)
--   7. Vistas y Índices
-- ============================================================

-- ============================================================
-- 1. SYSTEM SETUP
-- ============================================================

-- Habilitar extensión UUID para generar IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. CATÁLOGO - PRODUCTS
-- ============================================================

-- Productos principales de la tienda
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,              -- Reducido de 255 a 100
    brand VARCHAR(50) NOT NULL,              -- Reducido de 100 a 50
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    category VARCHAR(50),                    -- Reducido de 100 a 50
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),    -- TIMESTAMPTZ es más corto que TIMESTAMP WITH TIME ZONE
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Variantes de color por producto (stock por color)
CREATE TABLE IF NOT EXISTS product_colors (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,               -- Reducido de 100 a 50 (ej: "ROJO", "AZUL MARINO")
    hex VARCHAR(7) NOT NULL,                 -- Código hex color: #FFFFFF
    image_url TEXT,
    stock INTEGER DEFAULT 0
);

-- ============================================================
-- 2. CATÁLOGO - FONTS
-- ============================================================

-- Tipografías disponibles para diseños
CREATE TABLE IF NOT EXISTS fonts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,              -- Reducido de 255 a 100
    css_family VARCHAR(150) NOT NULL,        -- Reducido de 255 a 150
    category VARCHAR(30) DEFAULT 'BASICAS',  -- Reducido de 50 a 30
    preview_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CLIENTES - CUSTOMERS
-- ============================================================

-- Información de clientes
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,       -- Teléfono es el identificador único
    name VARCHAR(100),                       -- Reducido de 255 a 100
    email VARCHAR(150),                      -- Reducido de 255 a 150
    laser_points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. TRANSACCIONES - ORDERS
-- ============================================================

-- Cabecera de órdenes
-- Nota: Los campos customer_name/phone/email están duplicados
-- intencionalmente para snapshots históricos y consultas rápidas
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(20) PRIMARY KEY,              -- Formato: "LM-1001" (reducido de 50)
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(100) NOT NULL,     -- Reducido de 255 a 100
    customer_phone VARCHAR(20) NOT NULL,     -- Teléfono del cliente
    customer_email VARCHAR(150),             -- Reducido de 255 a 150
    status VARCHAR(20) DEFAULT 'PENDING_PAYMENT',    -- Reducido de 50 a 20
    payment_status VARCHAR(20) DEFAULT 'PENDING',    -- Reducido de 50 a 20
    payment_method VARCHAR(20),              -- Reducido de 50 a 20 (cash, transfer, card)
    delivery_method VARCHAR(20) DEFAULT 'PICKUP',    -- Reducido de 50 a 20 (pickup, shipping)
    shipping_address TEXT,                   -- Dirección completa de envío
    shipping_tracking VARCHAR(50),           -- Número de guía (reducido de 255)
    subtotal DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    coupon_code VARCHAR(30),                 -- Reducido de 50 a 30
    points_used INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    notes TEXT,
    is_priority BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de cada orden (productos + diseño)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(20) REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    color_name VARCHAR(50),                  -- Reducido de 100 a 50
    
    -- Cantidad y precios
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(10, 2) DEFAULT 0,
    
    -- Diseño FRENTE
    front_text VARCHAR(100),                 -- Reducido de 255 a 100
    front_text_2 VARCHAR(100),               -- Texto secundario frente
    front_font_id INTEGER REFERENCES fonts(id),
    front_font_id_2 INTEGER,                 -- Segunda fuente
    front_design_state JSONB,                -- Estado del diseño (posiciones, tamaños)
    front_design_state_2 JSONB,              -- Estado diseño secundario
    front_logos JSONB,                       -- Logos aplicados
    
    -- Diseño TRASERA
    back_text VARCHAR(100),                  -- Reducido de 255 a 100
    back_text_2 VARCHAR(100),
    back_font_id INTEGER REFERENCES fonts(id),
    back_font_id_2 INTEGER,
    back_design_state JSONB,
    back_design_state_2 JSONB,
    back_logos JSONB,
    
    -- Item de cliente (producto que trae el cliente)
    is_client_item BOOLEAN DEFAULT false,
    client_item_brand VARCHAR(50),           -- Reducido de 100 a 50
    client_item_color VARCHAR(50),           -- Reducido de 100 a 50
    notes TEXT
);

-- ============================================================
-- 5. MARKETING - COUPONS & POINTS
-- ============================================================

-- Cupones de descuento
CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,        -- Reducido de 50 a 30
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    max_uses INTEGER DEFAULT -1,             -- -1 = ilimitado
    used_count INTEGER DEFAULT 0,
    assigned_to_phone VARCHAR(20),           -- Cupón asignado a cliente específico
    expiry_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Historial de puntos (ganados y canjeados)
CREATE TABLE IF NOT EXISTS point_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    order_id VARCHAR(20) REFERENCES orders(id),
    amount INTEGER NOT NULL,                 -- Positivo = ganado, Negativo = canjeado
    type VARCHAR(20) NOT NULL,               -- 'EARNED' o 'REDEEMED'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CONFIGURACIÓN - STORE
-- ============================================================

-- Configuración general de la tienda
-- Nota: Esta tabla tiene solo 1 registro (singleton)
CREATE TABLE IF NOT EXISTS store_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    -- Identidad
    business_name VARCHAR(50) DEFAULT 'LASERMACHINE',
    logo_url TEXT,
    accent_color VARCHAR(7) DEFAULT '#facc15',       -- Color principal
    theme_dark_mode_bg VARCHAR(7) DEFAULT '#000000',
    bg_pattern VARCHAR(20) DEFAULT 'dots',           -- Reducido de 50
    
    -- Contadores
    next_order_id INTEGER DEFAULT 1000,              -- Para generar "LM-1001"
    points_percentage DECIMAL(5, 2) DEFAULT 5,        -- % de puntos por compra
    
    -- Contacto
    whatsapp VARCHAR(15),                            -- Reducido de 20
    instagram_url VARCHAR(150),                      -- Reducido de 255
    facebook_url VARCHAR(150),                       -- Reducido de 255
    
    -- Información adicional
    bank_info TEXT,                                  -- Datos bancarios
    shipping_info TEXT,                              -- Info de envíos
    
    -- Configuraciones JSON (flexibles)
    message_templates JSONB,                         -- Plantillas WhatsApp
    global_colors JSONB,                             -- Colores disponibles
    branding_assets JSONB,                           -- Logos y assets
    gallery_assets JSONB,                            -- Galería de imágenes
    product_categories JSONB,                        -- Categorías de productos
    admin_emails JSONB,                              -- Emails de administradores
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_config CHECK (id = 1)
);

-- ============================================================
-- 7. ÍNDICES PARA RENDIMIENTO
-- ============================================================

-- Órdenes: consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Clientes: búsqueda por teléfono
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Order items: join con órdenes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Productos: filtros por categoría
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Fuentes: filtros por categoría
CREATE INDEX IF NOT EXISTS idx_fonts_category ON fonts(category);
CREATE INDEX IF NOT EXISTS idx_fonts_active ON fonts(is_active);

-- ============================================================
-- 8. VISTAS ÚTILES
-- ============================================================

-- Resumen de cliente (órdenes, gasto total, último pedido)
CREATE OR REPLACE VIEW customer_summary AS
SELECT 
    c.id,
    c.phone,
    c.name,
    c.email,
    c.laser_points,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_spent,
    MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.phone, c.name, c.email, c.laser_points;

-- Ventas diarias
CREATE OR REPLACE VIEW daily_sales AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as order_count,
    SUM(total) as total_sales,
    AVG(total) as average_order_value
FROM orders
WHERE status NOT IN ('CANCELLED')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Productos más vendidos
CREATE OR REPLACE VIEW top_products AS
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    COUNT(oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.brand, p.category
ORDER BY total_revenue DESC;

-- ============================================================
-- 9. DATOS INICIALES
-- ============================================================

-- Insertar configuración por defecto (si no existe)
INSERT INTO store_config (
    id, business_name, points_percentage, 
    global_colors, product_categories, message_templates
) VALUES (
    1,
    'LASERMACHINE',
    5,
    '[
        {"name": "NEGRO", "hex": "#000000"},
        {"name": "BLANCO", "hex": "#FFFFFF"},
        {"name": "ACERO", "hex": "#C0C0C0"},
        {"name": "AZUL MARINO", "hex": "#000080"},
        {"name": "ROJO", "hex": "#FF0000"}
    ]'::jsonb,
    '["Tumblers", "Botellas", "Tazas", "Accesorios", "Termos"]'::jsonb,
    '{
        "confirmation": "Hola {NOMBRE}, tu orden #{ID} ha sido recibida. Total: {TOTAL}.",
        "production": "Hola {NOMBRE}, tu orden #{ID} ya entró a producción.",
        "ready": "Hola {NOMBRE}, tu pedido #{ID} está LISTO."
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- NOTAS DE MIGRACIÓN
-- ============================================================
-- Si ya tienes datos, PostgreSQL permite reducir VARCHAR sin pérdida:
-- ALTER TABLE products ALTER COLUMN name TYPE VARCHAR(100);
-- ALTER TABLE orders ALTER COLUMN status TYPE VARCHAR(20);
-- Estos cambios son seguros y no afectan los datos existentes.