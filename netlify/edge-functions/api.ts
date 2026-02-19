// Netlify Edge Function API for LaserMachine
// This handles all database operations through a single endpoint

import type { Config, Context } from "@netlify/functions";
import { neon } from '@neondatabase/serverless';

// Get SQL client
const getSql = () => {
  const url = Netlify.env.get("DATABASE_URL");
  if (!url) throw new Error("DATABASE_URL not configured");
  return neon(url);
};

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper to create response
const jsonResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

// Main handler
export default async (req: Request, context: Context) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/api", "").replace(/^\/+|\/+$/g, "");
  const segments = path.split("/").filter(Boolean);
  const resource = segments[0];
  const id = segments[1];

  try {
    const sql = getSql();

    // Route to appropriate handler
    switch (resource) {
      case "products":
        return handleProducts(req, sql, id);
      case "fonts":
        return handleFonts(req, sql, id);
      case "orders":
        return handleOrders(req, sql, id);
      case "customers":
        return handleCustomers(req, sql, id);
      case "config":
        return handleConfig(req, sql);
      case "coupons":
        return handleCoupons(req, sql, id);
      case "stats":
        return handleStats(req, sql);
      case "health":
        await sql`SELECT 1`;
        return jsonResponse({ status: "ok", timestamp: new Date().toISOString() });
      default:
        return jsonResponse({ error: "Not found" }, 404);
    }
  } catch (error: any) {
    console.error("API Error:", error);
    return jsonResponse({ error: error.message || "Internal server error" }, 500);
  }
};

// =============================================
// PRODUCTS HANDLER
// =============================================
async function handleProducts(req: Request, sql: any, id?: string) {
  switch (req.method) {
    case "GET": {
      if (id) {
        const [product] = await sql`
          SELECT p.*, 
            COALESCE(json_agg(json_build_object('id', pc.id, 'name', pc.name, 'hex', pc.hex, 'image_url', pc.image_url, 'stock', pc.stock)) 
            FILTER (WHERE pc.id IS NOT NULL), '[]') as colors
          FROM products p
          LEFT JOIN product_colors pc ON p.id = pc.product_id
          WHERE p.id = ${id}
          GROUP BY p.id
        `;
        return product ? jsonResponse(product) : jsonResponse({ error: "Not found" }, 404);
      }
      const products = await sql`
        SELECT p.*, 
          COALESCE(json_agg(json_build_object('id', pc.id, 'name', pc.name, 'hex', pc.hex, 'image_url', pc.image_url, 'stock', pc.stock)) 
          FILTER (WHERE pc.id IS NOT NULL), '[]') as colors
        FROM products p
        LEFT JOIN product_colors pc ON p.id = pc.product_id
        WHERE p.is_active = true
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;
      return jsonResponse(products);
    }
    
    case "POST": {
      const body = await req.json();
      const [product] = await sql`
        INSERT INTO products (name, brand, price, category, image_url)
        VALUES (${body.name}, ${body.brand}, ${body.price}, ${body.category || null}, ${body.image_url || null})
        RETURNING *
      `;
      
      if (body.colors?.length) {
        for (const color of body.colors) {
          await sql`
            INSERT INTO product_colors (product_id, name, hex, image_url, stock)
            VALUES (${product.id}, ${color.name}, ${color.hex}, ${color.image_url || null}, ${color.stock || 0})
          `;
        }
      }
      return jsonResponse(product, 201);
    }
    
    case "PUT": {
      if (!id) return jsonResponse({ error: "ID required" }, 400);
      const body = await req.json();
      const [updated] = await sql`
        UPDATE products SET
          name = COALESCE(${body.name || null}, name),
          brand = COALESCE(${body.brand || null}, brand),
          price = COALESCE(${body.price ?? null}, price),
          category = COALESCE(${body.category || null}, category),
          image_url = COALESCE(${body.image_url || null}, image_url),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      
      if (body.colors) {
        await sql`DELETE FROM product_colors WHERE product_id = ${id}`;
        for (const color of body.colors) {
          await sql`
            INSERT INTO product_colors (product_id, name, hex, image_url, stock)
            VALUES (${id}, ${color.name}, ${color.hex}, ${color.image_url || null}, ${color.stock || 0})
          `;
        }
      }
      return jsonResponse(updated);
    }
    
    case "DELETE": {
      if (!id) return jsonResponse({ error: "ID required" }, 400);
      await sql`UPDATE products SET is_active = false WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }
    
    default:
      return jsonResponse({ error: "Method not allowed" }, 405);
  }
}

// =============================================
// FONTS HANDLER
// =============================================
async function handleFonts(req: Request, sql: any, id?: string) {
  switch (req.method) {
    case "GET": {
      const fonts = await sql`SELECT * FROM fonts WHERE is_active = true ORDER BY category, name`;
      return jsonResponse(fonts);
    }
    
    case "POST": {
      const body = await req.json();
      const [font] = await sql`
        INSERT INTO fonts (name, css_family, category, preview_url)
        VALUES (${body.name}, ${body.css_family}, ${body.category || 'BASICAS'}, ${body.preview_url || null})
        RETURNING *
      `;
      return jsonResponse(font, 201);
    }
    
    case "PUT": {
      if (!id) return jsonResponse({ error: "ID required" }, 400);
      const body = await req.json();
      const [updated] = await sql`
        UPDATE fonts SET
          name = COALESCE(${body.name || null}, name),
          css_family = COALESCE(${body.css_family || null}, css_family),
          category = COALESCE(${body.category || null}, category),
          preview_url = COALESCE(${body.preview_url || null}, preview_url)
        WHERE id = ${id}
        RETURNING *
      `;
      return jsonResponse(updated);
    }
    
    case "DELETE": {
      if (!id) return jsonResponse({ error: "ID required" }, 400);
      await sql`UPDATE fonts SET is_active = false WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }
    
    default:
      return jsonResponse({ error: "Method not allowed" }, 405);
  }
}

// =============================================
// ORDERS HANDLER
// =============================================
async function handleOrders(req: Request, sql: any, id?: string) {
  switch (req.method) {
    case "GET": {
      const url = new URL(req.url);
      const status = url.searchParams.get("status");
      
      let orders;
      if (status) {
        orders = await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY is_priority DESC, created_at DESC`;
      } else {
        orders = await sql`SELECT * FROM orders ORDER BY is_priority DESC, created_at DESC`;
      }
      
      // Get items for each order
      for (const order of orders) {
        const items = await sql`SELECT * FROM order_items WHERE order_id = ${order.id}`;
        order.items = items;
      }
      
      return jsonResponse(orders);
    }
    
    case "POST": {
      const body = await req.json();
      
      // Create or get customer
      const [customer] = await sql`
        INSERT INTO customers (phone, name, email)
        VALUES (${body.customer_phone}, ${body.customer_name || null}, ${body.customer_email || null})
        ON CONFLICT (phone) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, customers.name),
          email = COALESCE(EXCLUDED.email, customers.email),
          updated_at = NOW()
        RETURNING *
      `;
      
      // Generate order ID
      const [config] = await sql`
        UPDATE store_config SET next_order_id = next_order_id + 1 WHERE id = 1 RETURNING next_order_id
      `;
      const orderId = body.id || `LM-${config.next_order_id}`;
      
      // Create order
      const [order] = await sql`
        INSERT INTO orders (
          id, customer_id, customer_name, customer_phone, customer_email,
          status, payment_status, payment_method, delivery_method, shipping_address,
          subtotal, discount, total, coupon_code, points_used, points_earned, notes, is_priority
        ) VALUES (
          ${orderId}, ${customer.id}, ${body.customer_name}, ${body.customer_phone}, ${body.customer_email || null},
          ${body.status || 'PENDING_PAYMENT'}, ${body.payment_status || 'PENDING'}, ${body.payment_method || null}, ${body.delivery_method || 'PICKUP'}, ${body.shipping_address || null},
          ${body.subtotal || 0}, ${body.discount || 0}, ${body.total || 0}, ${body.coupon_code || null}, ${body.points_used || 0}, ${body.points_earned || 0}, ${body.notes || null}, ${body.is_priority || false}
        )
        RETURNING *
      `;
      
      // Create order items
      if (body.items?.length) {
        for (const item of body.items) {
          await sql`
            INSERT INTO order_items (
              order_id, product_id, color_name, quantity, unit_price, total_price,
              front_text, front_text_2, front_font_id, front_font_id_2, front_design_state,
              back_text, back_font_id, back_design_state,
              is_client_item, client_item_brand, client_item_color, notes
            ) VALUES (
              ${orderId}, ${item.product_id || null}, ${item.color_name || null}, ${item.quantity}, ${item.unit_price}, ${item.total_price},
              ${item.front_text || null}, ${item.front_text_2 || null}, ${item.front_font_id || null}, ${item.front_font_id_2 || null}, ${item.front_design_state ? JSON.stringify(item.front_design_state) : null},
              ${item.back_text || null}, ${item.back_font_id || null}, ${item.back_design_state ? JSON.stringify(item.back_design_state) : null},
              ${item.is_client_item || false}, ${item.client_item_brand || null}, ${item.client_item_color || null}, ${item.notes || null}
            )
          `;
        }
      }
      
      return jsonResponse(order, 201);
    }
    
    case "PUT": {
      if (!id) return jsonResponse({ error: "ID required" }, 400);
      const body = await req.json();
      const [updated] = await sql`
        UPDATE orders SET
          status = COALESCE(${body.status || null}, status),
          payment_status = COALESCE(${body.payment_status || null}, payment_status),
          payment_method = COALESCE(${body.payment_method || null}, payment_method),
          shipping_tracking = COALESCE(${body.shipping_tracking || null}, shipping_tracking),
          notes = COALESCE(${body.notes || null}, notes),
          is_priority = COALESCE(${body.is_priority ?? null}, is_priority),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return jsonResponse(updated);
    }
    
    default:
      return jsonResponse({ error: "Method not allowed" }, 405);
  }
}

// =============================================
// CUSTOMERS HANDLER
// =============================================
async function handleCustomers(req: Request, sql: any, id?: string) {
  switch (req.method) {
    case "GET": {
      const url = new URL(req.url);
      const phone = url.searchParams.get("phone");
      
      if (phone) {
        const [customer] = await sql`SELECT * FROM customer_summary WHERE phone = ${phone}`;
        return customer ? jsonResponse(customer) : jsonResponse({ error: "Not found" }, 404);
      }
      
      const customers = await sql`SELECT * FROM customer_summary ORDER BY total_spent DESC`;
      return jsonResponse(customers);
    }
    
    case "POST": {
      const body = await req.json();
      const [customer] = await sql`
        INSERT INTO customers (phone, name, email, laser_points)
        VALUES (${body.phone}, ${body.name || null}, ${body.email || null}, ${body.laser_points || 0})
        ON CONFLICT (phone) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, customers.name),
          email = COALESCE(EXCLUDED.email, customers.email),
          updated_at = NOW()
        RETURNING *
      `;
      return jsonResponse(customer, 201);
    }
    
    case "PUT": {
      if (!id) return jsonResponse({ error: "Phone required" }, 400);
      const body = await req.json();
      
      if (body.points_add) {
        await sql`UPDATE customers SET laser_points = laser_points + ${body.points_add}, updated_at = NOW() WHERE phone = ${id}`;
      }
      if (body.points_subtract) {
        await sql`UPDATE customers SET laser_points = GREATEST(0, laser_points - ${body.points_subtract}), updated_at = NOW() WHERE phone = ${id}`;
      }
      
      const [updated] = await sql`
        UPDATE customers SET
          name = COALESCE(${body.name || null}, name),
          email = COALESCE(${body.email || null}, email),
          updated_at = NOW()
        WHERE phone = ${id}
        RETURNING *
      `;
      return jsonResponse(updated);
    }
    
    default:
      return jsonResponse({ error: "Method not allowed" }, 405);
  }
}

// =============================================
// CONFIG HANDLER
// =============================================
async function handleConfig(req: Request, sql: any) {
  switch (req.method) {
    case "GET": {
      const [config] = await sql`SELECT * FROM store_config WHERE id = 1`;
      return jsonResponse(config);
    }
    
    case "PUT": {
      const body = await req.json();
      await sql`
        UPDATE store_config SET
          business_name = COALESCE(${body.business_name || null}, business_name),
          logo_url = COALESCE(${body.logo_url || null}, logo_url),
          accent_color = COALESCE(${body.accent_color || null}, accent_color),
          points_percentage = COALESCE(${body.points_percentage ?? null}, points_percentage),
          whatsapp = COALESCE(${body.whatsapp || null}, whatsapp),
          instagram_url = COALESCE(${body.instagram_url || null}, instagram_url),
          bank_info = COALESCE(${body.bank_info || null}, bank_info),
          shipping_info = COALESCE(${body.shipping_info || null}, shipping_info),
          message_templates = COALESCE(${body.message_templates ? JSON.stringify(body.message_templates) : null}::jsonb, message_templates),
          global_colors = COALESCE(${body.global_colors ? JSON.stringify(body.global_colors) : null}::jsonb, global_colors),
          product_categories = COALESCE(${body.product_categories ? JSON.stringify(body.product_categories) : null}::jsonb, product_categories),
          updated_at = NOW()
        WHERE id = 1
      `;
      const [config] = await sql`SELECT * FROM store_config WHERE id = 1`;
      return jsonResponse(config);
    }
    
    default:
      return jsonResponse({ error: "Method not allowed" }, 405);
  }
}

// =============================================
// COUPONS HANDLER
// =============================================
async function handleCoupons(req: Request, sql: any, id?: string) {
  const url = new URL(req.url);
  
  switch (req.method) {
    case "GET": {
      const code = url.searchParams.get("code");
      const phone = url.searchParams.get("phone");
      
      if (code) {
        // Validate coupon
        const [coupon] = await sql`SELECT * FROM coupons WHERE code = ${code} AND is_active = true`;
        
        if (!coupon) {
          return jsonResponse({ valid: false, message: "Cupón no válido" });
        }
        if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
          return jsonResponse({ valid: false, message: "Cupón expirado" });
        }
        if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
          return jsonResponse({ valid: false, message: "Cupón agotado" });
        }
        if (coupon.assigned_to_phone && coupon.assigned_to_phone !== phone) {
          return jsonResponse({ valid: false, message: "Este cupón no es válido para tu cuenta" });
        }
        
        return jsonResponse({ valid: true, discount: coupon.discount_percent });
      }
      
      const coupons = await sql`SELECT * FROM coupons WHERE is_active = true ORDER BY created_at DESC`;
      return jsonResponse(coupons);
    }
    
    case "POST": {
      const body = await req.json();
      
      if (body.use_code) {
        // Mark coupon as used
        await sql`UPDATE coupons SET used_count = used_count + 1 WHERE code = ${body.use_code}`;
        return jsonResponse({ success: true });
      }
      
      const [coupon] = await sql`
        INSERT INTO coupons (code, discount_percent, max_uses, assigned_to_phone, expiry_date)
        VALUES (${body.code}, ${body.discount_percent}, ${body.max_uses || -1}, ${body.assigned_to_phone || null}, ${body.expiry_date || null})
        RETURNING *
      `;
      return jsonResponse(coupon, 201);
    }
    
    case "DELETE": {
      if (!id) return jsonResponse({ error: "ID required" }, 400);
      await sql`UPDATE coupons SET is_active = false WHERE id = ${id}`;
      return jsonResponse({ success: true });
    }
    
    default:
      return jsonResponse({ error: "Method not allowed" }, 405);
  }
}

// =============================================
// STATS HANDLER
// =============================================
async function handleStats(req: Request, sql: any) {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "overview";
  
  switch (type) {
    case "overview": {
      const [stats] = await sql`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED')) as pending,
          COUNT(*) FILTER (WHERE status IN ('IN_PRODUCTION', 'PRINTING')) as in_production,
          COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
          COALESCE(SUM(total) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as today_revenue,
          COALESCE(SUM(total), 0) as total_revenue
        FROM orders
        WHERE status != 'CANCELLED'
      `;
      return jsonResponse(stats);
    }
    
    case "daily": {
      const days = parseInt(url.searchParams.get("days") || "30");
      const sales = await sql`
        SELECT * FROM daily_sales 
        WHERE date >= CURRENT_DATE - ${days}
        ORDER BY date DESC
      `;
      return jsonResponse(sales);
    }
    
    case "top_customers": {
      const customers = await sql`
        SELECT * FROM customer_summary 
        WHERE total_orders > 0 
        ORDER BY total_spent DESC 
        LIMIT 10
      `;
      return jsonResponse(customers);
    }
    
    default:
      return jsonResponse({ error: "Invalid stats type" }, 400);
  }
}

// Netlify Edge Function config
export const config: Config = {
  path: "/api/*",
};
