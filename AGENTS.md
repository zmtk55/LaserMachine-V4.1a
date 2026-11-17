# LaserMachine V4.1a - AI Agent Documentation

> **Language Note:** Este proyecto utiliza español como idioma principal para la interfaz de usuario y documentación de negocio. El código y comentarios técnicos están en inglés y español.

## Project Overview

**LaserMachine** is a comprehensive e-commerce and order management system for a laser engraving business. It allows customers to personalize products (tumblers, bottles, mugs) with custom text and logos, while providing administrators with full order lifecycle management, inventory tracking, and customer relationship tools.

### Key Business Features

- **Product Catalog:** YETI, Stanley, HydroFlask, Owala, and generic products
- **Product Customizer:** Visual design tool for engraving text and logos on products
- **Order Management:** Complete workflow from receipt → production → delivery
- **Loyalty Program:** Points system ("Laser Points") for customer retention
- **Referral System:** Coupon-based ambassador program
- **WhatsApp Integration:** Automated notifications and customer communication
- **Multi-payment Support:** Cash, transfer, card (MercadoPago no es real: se eliminó la simulación en nov 2026; los pedidos quedan PENDIENTES)

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework |
| TypeScript | ~5.8.2 | Type safety |
| Vite | ^6.2.0 | Build tool & dev server |
| Tailwind CSS | CDN | Utility-first styling |
| Lucide React | 0.344.0 | Icon library |
| Lottie React | ^2.4.1 | Animations |

### Backend & Services
| Service | Purpose |
|---------|---------|
| Firebase Auth | User authentication (Email, Google, Anonymous) — SOLO para el admin y sesiones de invitado |
| Firebase Firestore | Perfiles de usuario y roles (`users/{uid}`); NO es la base de datos de la tienda |
| Firebase Storage | File uploads and assets |
| Supabase (Postgres) | Base de datos de la tienda: productos, pedidos, fuentes y configuración (`services/supabaseService.ts`) |
| Neon PostgreSQL | Serverless SQL database (via Netlify Edge Functions) — legado, solo lo usa el asistente de comandos |
| Groq API | AI-powered command assistant (RAB) |
| imgly/background-removal | AI background removal for logos |

### Deployment
- **Primary:** Netlify (configured via `netlify.toml`)
- **Secondary:** Vercel (configured via `vercel.json`)

---

## Project Structure

```
├── components/           # 29 React components
│   ├── AdminDashboard.tsx       # Main admin interface (10+ tabs)
│   ├── ProductVisualizer.tsx    # Engraving design tool
│   ├── ClientDashboard.tsx      # Customer self-service portal
│   ├── CommandAssistant.tsx     # AI-powered assistant (Cmd+K)
│   ├── LandingPage.tsx          # Marketing landing page
│   ├── NavBar.tsx               # Main navigation
│   ├── AuthModal.tsx            # Login/register modal
│   └── ... (21 more components)
│
├── contexts/             # React Context providers
│   ├── BackgroundContext.tsx    # Dynamic background management
│   ├── CartContext.tsx          # Shopping cart state
│   └── NotificationContext.tsx  # Toast notification system
│
├── services/             # Business logic & external APIs
│   ├── auth.ts                  # Firebase authentication
│   ├── firebaseService.ts       # Firestore data migration (one-time, admin)
│   ├── supabaseService.ts       # Supabase database: products, orders, fonts, config
│   ├── apiService.ts            # API client utilities
│   └── neonService.ts           # PostgreSQL via Edge Functions (legacy)
│
├── utils/                # Utility functions
│   └── imageUtils.ts            # Image processing helpers
│
├── database/             # Database configuration
│   ├── schema.sql               # PostgreSQL schema
│   ├── init.mjs                 # Database initialization
│   └── setup.mjs                # Setup scripts
│
├── src/styles/           # Design system
│   └── design-tokens.css        # Comprehensive CSS variables
│
├── netlify/functions/    # Edge Functions
│   └── api.ts                   # REST API for Neon database
│
├── public/               # Static assets
│   ├── images/products/yeti/    # YETI product images
│   └── assets/icons/            # App icons
│
├── App.tsx               # Main application component (~1500 lines)
├── index.tsx             # React entry point
├── types.ts              # TypeScript type definitions (~300 lines)
├── constants.ts          # Default data (products, fonts, mock orders)
└── firebaseConfig.ts     # Firebase initialization
```

---

## Build and Development Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Preview production build
npm run preview
```

### Build
```bash
# Production build (outputs to dist/)
npm run build
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure required variables:
   - `VITE_GROQ_API_KEY` - For AI assistant functionality (ojo: el código lee `VITE_GROQ_API_KEY`, no `GROQ_API_KEY`)
   - `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` - Database (productos, pedidos, config); sin ellas la app usa solo localStorage
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` - Auth del admin y Storage; sin ellas el login muestra "El inicio de sesión no está configurado" y nadie entra como admin
   - `DATABASE_URL` - Optional, for Neon PostgreSQL backend (server-side only; NUNCA con prefijo `VITE_`)
   - `VITE_REMOVE_BG_API_KEY` - Optional, for AI background removal

---

## Code Style Guidelines

### TypeScript Conventions
- **Strict typing enabled:** All components use explicit TypeScript types
- **Interface naming:** PascalCase (e.g., `Order`, `Product`, `StoreConfig`)
- **Enum naming:** PascalCase with UPPER_SNAKE_CASE values (e.g., `OrderStatus.RECEIVED`)
- **Type imports:** Use `import type { ... }` where applicable

### Naming Conventions
```typescript
// Components: PascalCase
const AdminDashboard = () => { }
const ProductCard = () => { }

// Hooks: camelCase with 'use' prefix
const useCart = () => { }

// Constants: UPPER_SNAKE_CASE (in constants.ts)
export const DEFAULT_PRICING = { ... }
export const PRODUCTS: Product[] = [ ... ]

// Local state: camelCase
const [isDarkMode, setIsDarkMode] = useState(true)
const [orders, setOrders] = useState<Order[]>([])
```

### File Organization
- One primary component per file
- Helper functions can be in `-helper.ts` files (e.g., `AdminDashboard-helper.ts`)
- Types always in `types.ts`
- Constants always in `constants.ts`

### CSS/Styling
- **Primary:** Tailwind CSS utility classes
- **Design System:** CSS variables from `design-tokens.css`
- **Custom classes:** Use `.btn-system-*`, `.card-system`, `.glass` patterns
- **Dark mode:** Use `.dark` class prefix or `dark:` Tailwind modifier

---

## Key Architectural Patterns

### State Management
- **Local state:** `useState` for component-level state
- **Shared state:** React Context for cross-cutting concerns (Cart, Notifications, Background)
- **Persistent state:** `localStorage` for offline-first data (products, orders, config)
- **Server state:** Supabase for shared data (products, orders, fonts, config); Firebase Auth for the admin session. `App.tsx` carga desde Supabase al arrancar y sincroniza cada cambio local a la nube (debounce 800 ms); si Supabase no está configurado o las tablas no existen, todo sigue en localStorage sin romper la app.

### Data Flow
```
User Action → Component → localStorage → (debounced) Supabase sync
                    ↓
               Context Update → Re-render
```
On load: `Supabase (si hay datos) → state`, si no `localStorage → state`.

### View State Management
The app uses a single `view` state in App.tsx to control the main view:
```typescript
type ViewState = 'LANDING' | 'SHOP' | 'CUSTOMER' | 'CUSTOMIZER' | 
                 'CART' | 'ADMIN_DASHBOARD' | 'CLIENT_DASHBOARD' | 
                 'FONTS_SHOWCASE' | 'PUBLIC_TRACKING' | 'TRACKING'
```

### Authentication Flow
1. Sin sesión no hay usuario (`user = null`): la tienda y el personalizador son PÚBLICOS y funcionan sin login.
2. El login es SOLO para el admin, con Firebase Auth (email/contraseña o Google) desde el modal de acceso (icono del escudo, 3 clics).
3. El rol ADMIN se decide en `services/auth.ts` así: (a) el documento `users/{uid}` en Firestore tiene `role: 'ADMIN'`, o (b) el correo está en `adminEmails` de la configuración de la tienda. NO hay correos de admin hardcodeados en el código.
4. Primer admin (bootstrap): crear el usuario en Firebase Console → Authentication → Add user, iniciar sesión una vez en la app, y en Firestore poner `users/{uid}.role = 'ADMIN'` (o añadir el correo a `adminEmails` en la configuración, una vez dentro como admin). Sin este paso, el login entra como CLIENT y el panel de admin deniega el acceso.
5. Si Firebase no está configurado (sin `VITE_FIREBASE_*`), el login falla con el mensaje "El inicio de sesión no está configurado" y los botones de invitado/Google aparecen deshabilitados; nadie entra como admin.
6. Guest users: Anonymous auth with phone-based lookup. El captcha matemático del modal fue eliminado (era solo cliente, no protegía nada); queda el rate-limit en memoria (5 intentos/min).
7. El listener `onAuthChange` en `App.tsx` mantiene la sesión entre recargas.

---

## Testing Instructions

### Manual Testing Checklist

#### Customer Flow
1. **Landing Page** - Verify product display and navigation
2. **Shop** - Browse products, select variants
3. **Customizer** - Add text, change fonts, upload logos
4. **Cart** - Review items, apply coupons
5. **Checkout** - Enter customer info, select payment method

#### Admin Flow
1. **Dashboard** - View stats, recent orders
2. **Orders** - Create, edit, update status, send WhatsApp
3. **Inventory** - Manage stock, add/edit products
4. **Clients** - View customer history, manage points
5. **Settings** - Configure store, pricing, coupons

#### Key Features to Verify
- Dark/light mode toggle
- Background customization (upload/image URL)
- Command assistant (Cmd+K shortcut)
- Mobile responsiveness
- Order status workflow: Received → Production → Ready → Completed

### Debug Mode
El helper `?debugbg=1` fue eliminado de producción por seguridad (nov 2026). Para depurar el fondo, inspeccionar la variable CSS `--app-bg` en DevTools.

---

## Security Considerations

### Firebase Configuration
- Toda la configuración viene de variables de entorno (`VITE_FIREBASE_*`, ver `.env.example`). NUNCA hardcodear credenciales en `firebaseConfig.ts` y NUNCA permitir sobrescribir la configuración desde `localStorage` (se eliminó en nov 2026).
- Validation ensures API keys start with "AIza"

### Rate Limiting
- In-memory attempt tracking for auth operations
- 5 attempts per minute window
- Client identifier stored in `sessionStorage`

### Input Validation
- Phone number normalization (10 digits + 52 prefix for MX)
- Order ID format: `LM-{timestamp base36 + aleatorio}` (único entre navegadores; el contador local `nextOrderId` quedó sin uso)
- Email validation via Firebase Auth

### Admin Access
- No hay admins hardcodeados: ni `ADMIN_USER` (quedó como constante sin uso en `constants.ts`, pendiente de borrar), ni lista de correos en `services/auth.ts`, ni usuario demo.
- El rol ADMIN viene del documento `users/{uid}` en Firestore o de `adminEmails` en la configuración de la tienda (ver "Authentication Flow").
- Role-based UI rendering (`user.role === UserRole.ADMIN`)
- Solo `ADMIN_DASHBOARD` y `CLIENT_DASHBOARD` exigen sesión (guard en `App.tsx`); SHOP, FONTS_SHOWCASE y CUSTOMIZER son públicos.

### Environment Variables
**NEVER commit `.env.local` to git.** The following are sensitive:
- `VITE_GROQ_API_KEY` (el código lee esta, no `GROQ_API_KEY`)
- `DATABASE_URL` — server-side only. NUNCA con prefijo `VITE_`: `VITE_DATABASE_URL` expondría la URL completa (con contraseña) dentro del bundle del navegador. Ojo: `services/neonService.ts` todavía busca `VITE_DATABASE_URL` en el navegador (líneas ~11 y ~20); esa variable no debe existir nunca. El servicio quedó así a propósito (fuera de alcance de esta tarea) y solo lo usa el asistente de comandos.
- `VITE_SUPABASE_ANON_KEY` — segura en el navegador (el acceso lo controla RLS); NUNCA poner la `service_role` key en el frontend.
- Firebase credentials (if using env vars)

### Supabase — base de datos (productos, pedidos, fuentes, config)
- Cliente en `services/supabaseService.ts`; variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (ver `.env.example`).
- `App.tsx` lee de Supabase al arrancar (solo si trae datos reemplaza lo local) y sube cada cambio con debounce de 800 ms. Sin Supabase o sin tablas, la app usa localStorage y avisa en consola; nunca se rompe.
- **El dueño debe crear las tablas a mano**: ejecutar `database/supabase-schema.sql` en Supabase Dashboard → SQL Editor. Tablas:
  - `products` (id text PK, name, brand, category, price, stock_threshold, image_url, colors JSONB, laser_preset_id, sku, is_active, created_at, updated_at)
  - `orders` (id text PK, user_id, customer_name, customer_company, customer_phone, customer_email, items JSONB, coupon_used, discount_amount, points_redeemed, points_earned, total, payment_status, payment_method, amount_paid, delivery_method, delivery_date, delivery_time, shipping_provider, shipping_tracking, shipping_address, status, is_priority, history JSONB, created_at, mockup_url, internal_notes JSONB, updated_at)
  - `fonts` (id bigint PK, name, css_family, category, categories JSONB, is_custom, file_data, preview_url, is_active, created_at)
  - `store_config` (id int PK = 1, data JSONB con todo el StoreConfig, updated_at)
- **RLS NO se puede activar desde el código.** El mismo archivo `database/supabase-schema.sql` incluye `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` y las políticas mínimas, que se crean al ejecutar el SQL en el panel:
  - Lectura pública de `products`, `fonts` y `store_config` (la tienda las necesita sin login).
  - `orders`: INSERT para anónimos (el cliente crea su pedido), SELECT para anónimos (seguimiento público por nº de pedido y panel admin), UPDATE/DELETE para anónimos (los usa el admin desde el navegador).
  - Escritura de `products`/`fonts`/`store_config` para anónimos (la usa el admin desde el navegador).
  - Limitación conocida: como la app usa Firebase Auth y no Supabase Auth, Supabase no distingue al admin de un visitante, así que las escrituras van con la anon key. Quien inspeccione el JS podría escribir. Endurecerlo exige mover las escrituras de admin a un backend (Netlify Function con la `service_role` key) o adoptar Supabase Auth. Hasta entonces, estas políticas son el mínimo viable.
- El `pricing` (precios de grabado) sigue solo en localStorage; no está en Supabase.

---

## Database Schema (PostgreSQL)

> Este esquema es el de Neon (legado, `database/schema.sql`). La base de
> datos activa es Supabase: ver la sección "Supabase" en Security
> Considerations y el archivo `database/supabase-schema.sql`.

### Core Tables
| Table | Purpose |
|-------|---------|
| `products` | Product catalog |
| `product_colors` | Color variants per product |
| `fonts` | Available typography options |
| `customers` | Customer profiles (phone is unique key) |
| `orders` | Order headers with customer snapshot |
| `order_items` | Line items with design state (JSONB) |
| `coupons` | Discount codes |
| `point_transactions` | Loyalty points history |
| `store_config` | Singleton configuration table |

### Key Design Decisions
- **Phone as primary customer identifier** - Matches business workflow
- **JSONB for design state** - Flexible storage for engraving positions/sizes
- **Customer snapshot in orders** - Historical data preservation
- **Soft deletes** - `is_active` flag instead of DELETE

---

## API Endpoints (Netlify Edge Functions)

Base path: `/api/*`

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/products` | GET, POST, PUT, DELETE | Product CRUD |
| `/api/orders` | GET, POST, PUT | Order management |
| `/api/customers` | GET, POST, PUT | Customer lookup |
| `/api/coupons` | GET, POST, DELETE | Coupon validation |
| `/api/config` | GET, PUT | Store settings |
| `/api/stats` | GET | Analytics data |
| `/api/health` | GET | Health check |

---

## Deployment Notes

### Netlify Configuration
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Edge Functions:** `netlify/functions/`
- **SPA redirect:** All routes → `index.html` (200 status)

### Static Assets
- Long-term caching for `/assets/*`, `*.js`, `*.css`
- Security headers configured in `netlify.toml`

### Vercel Alternative
Basic configuration in `vercel.json` for secondary deployment.

---

## Common Development Tasks

### Adding a New Product
1. Add product images to `public/images/products/`
2. Update `constants.ts` → `PRODUCTS` array
3. Increment localStorage version key (e.g., `lm_products_v14`)

### Adding a New Font
1. Upload font file via Admin Dashboard (Fonts tab)
2. Or add to `constants.ts` → `FONTS` array
3. Font categories: `'DEPORTE' | 'CURSIVA' | 'FONTS 2026' | 'KIDS' | 'BASICAS'`

### Modifying Order Status Workflow
Edit `types.ts` → `OrderStatus` enum and update status UI in `AdminDashboard.tsx`.

### Customizing Themes
Edit `src/styles/design-tokens.css` for design system changes, or use Admin Dashboard → Settings → Branding for runtime customization.

---

## Troubleshooting

### Firebase Not Initialized
Check console for "⚠️ Configuración de Firebase inválida". Verify:
- `apiKey` starts with "AIza"
- `projectId` is present
- Domain is authorized in Firebase Console

### localStorage Data Issues
Versioned storage keys (e.g., `lm_products_v13`) prevent schema conflicts. To force reset:
```javascript
localStorage.clear(); // Remove all app data
```

### Background Not Showing
Check `--app-bg` CSS variable. (El helper `?debugbg=1` fue eliminado de producción por seguridad.)

### Build Errors
- Ensure Node.js version compatibility
- Check `tsconfig.json` paths match `@/*` alias in imports
- Verify all dependencies installed (`npm install`)

---

## External Dependencies & Licenses

- **Firebase:** BSD-3-Clause (Google)
- **React:** MIT (Meta)
- **Tailwind CSS:** MIT
- **Lucide:** ISC
- **Vite:** MIT

---

## Contact & Support

For technical issues or questions about this codebase:
- Review existing comments in source files (mixed ES/EN)
- Check Firebase Console for authentication/database issues
- Verify Netlify function logs for API errors

---

*Last updated: February 2026*
*Project: LaserMachine V4.1a*
*Primary Language: Español (UI), English/Spanish (Code)*
