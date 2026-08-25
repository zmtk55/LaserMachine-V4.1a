// Direct database setup for Neon
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL env var required');
  process.exit(1);
}

async function setupDatabase() {
  console.log('Connecting to Neon database...');
  const sql = neon(DATABASE_URL);
  
  try {
    // Enable UUID extension
    console.log('Creating UUID extension...');
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // Create products table
    console.log('Creating products table...');
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0,
        category VARCHAR(100),
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create product colors table
    console.log('Creating product_colors table...');
    await sql`
      CREATE TABLE IF NOT EXISTS product_colors (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        hex VARCHAR(7) NOT NULL,
        image_url TEXT,
        stock INTEGER DEFAULT 0
      )
    `;
    
    // Create fonts table
    console.log('Creating fonts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS fonts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        css_family VARCHAR(255) NOT NULL,
        category VARCHAR(50) DEFAULT 'BASICAS',
        preview_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create customers table
    console.log('Creating customers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        laser_points INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create orders table
    console.log('Creating orders table...');
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'PENDING_PAYMENT',
        payment_status VARCHAR(50) DEFAULT 'PENDING',
        payment_method VARCHAR(50),
        delivery_method VARCHAR(50) DEFAULT 'PICKUP',
        shipping_address TEXT,
        shipping_tracking VARCHAR(255),
        subtotal DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) DEFAULT 0,
        coupon_code VARCHAR(50),
        points_used INTEGER DEFAULT 0,
        points_earned INTEGER DEFAULT 0,
        notes TEXT,
        is_priority BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create order items table
    console.log('Creating order_items table...');
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        color_name VARCHAR(100),
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(10, 2) DEFAULT 0,
        total_price DECIMAL(10, 2) DEFAULT 0,
        front_text VARCHAR(255),
        front_text_2 VARCHAR(255),
        front_font_id INTEGER,
        front_font_id_2 INTEGER,
        front_design_state JSONB,
        front_design_state_2 JSONB,
        front_logos JSONB,
        back_text VARCHAR(255),
        back_text_2 VARCHAR(255),
        back_font_id INTEGER,
        back_font_id_2 INTEGER,
        back_design_state JSONB,
        back_design_state_2 JSONB,
        back_logos JSONB,
        is_client_item BOOLEAN DEFAULT false,
        client_item_brand VARCHAR(100),
        client_item_color VARCHAR(100),
        notes TEXT
      )
    `;
    
    // Create store config table
    console.log('Creating store_config table...');
    await sql`
      CREATE TABLE IF NOT EXISTS store_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        business_name VARCHAR(255) DEFAULT 'LASERMACHINE',
        logo_url TEXT,
        accent_color VARCHAR(7) DEFAULT '#facc15',
        theme_dark_mode_bg VARCHAR(7) DEFAULT '#000000',
        bg_pattern VARCHAR(50) DEFAULT 'dots',
        next_order_id INTEGER DEFAULT 1000,
        points_percentage DECIMAL(5, 2) DEFAULT 5,
        whatsapp VARCHAR(20),
        instagram_url VARCHAR(255),
        facebook_url VARCHAR(255),
        bank_info TEXT,
        shipping_info TEXT,
        message_templates JSONB,
        global_colors JSONB,
        branding_assets JSONB,
        gallery_assets JSONB,
        product_categories JSONB,
        admin_emails JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create coupons table
    console.log('Creating coupons table...');
    await sql`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        max_uses INTEGER DEFAULT -1,
        used_count INTEGER DEFAULT 0,
        assigned_to_phone VARCHAR(20),
        expiry_date TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create point transactions table
    console.log('Creating point_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        order_id VARCHAR(50) REFERENCES orders(id),
        amount INTEGER NOT NULL,
        type VARCHAR(20) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    // Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_fonts_category ON fonts(category)`;
    
    // Insert default config
    console.log('Inserting default config...');
    await sql`
      INSERT INTO store_config (id, business_name, points_percentage, global_colors, product_categories, message_templates)
      VALUES (
        1,
        'LASERMACHINE',
        5,
        '[{"name": "NEGRO", "hex": "#000000"}, {"name": "BLANCO", "hex": "#FFFFFF"}, {"name": "ACERO", "hex": "#C0C0C0"}, {"name": "AZUL MARINO", "hex": "#000080"}, {"name": "ROJO", "hex": "#FF0000"}]'::jsonb,
        '["Tumblers", "Botellas", "Tazas", "Accesorios", "Termos"]'::jsonb,
        '{"confirmation": "Hola {NOMBRE}, tu orden #{ID} ha sido recibida. Total: {TOTAL}.", "production": "Hola {NOMBRE}, tu orden #{ID} ya entró a producción.", "ready": "Hola {NOMBRE}, tu pedido #{ID} está LISTO."}'::jsonb
      ) ON CONFLICT (id) DO NOTHING
    `;
    
    // Create views
    console.log('Creating views...');
    await sql`
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
      GROUP BY c.id, c.phone, c.name, c.email, c.laser_points
    `;
    
    await sql`
      CREATE OR REPLACE VIEW daily_sales AS
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total) as total_sales,
        AVG(total) as average_order_value
      FROM orders
      WHERE status NOT IN ('CANCELLED')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    console.log('\n✅ Database setup complete!');
    
    // Verify tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log('\nTables created:', tables.map(t => t.table_name).join(', '));
    
    // Verify views
    const views = await sql`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('Views created:', views.map(v => v.table_name).join(', '));
    
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

setupDatabase();
