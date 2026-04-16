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
- **Multi-payment Support:** Cash, transfer, card, and MercadoPago

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
| Firebase Auth | User authentication (Email, Google, Anonymous) |
| Firebase Firestore | Primary database (optional cloud sync) |
| Firebase Storage | File uploads and assets |
| Neon PostgreSQL | Serverless SQL database (via Netlify Edge Functions) |
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
│   ├── ClientDashboard.tsx      # Customer self-service portal (premium mobile-first UX)
│   ├── client/dashboard/        # Client dashboard sub-components
│   │   ├── StatusBadge.tsx      # Order status badges with config
│   │   ├── OrderTimeline.tsx    # Visual order progress timeline
│   │   ├── EmptyState.tsx       # Branded empty state illustrations
│   │   └── BottomNav.tsx        # Glassmorphism bottom navigation
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
│   ├── firebaseService.ts       # Firestore data migration
│   ├── apiService.ts            # API client utilities
│   └── neonService.ts           # PostgreSQL via Edge Functions
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
   - `GROQ_API_KEY` - For AI assistant functionality
   - `DATABASE_URL` - Optional, for Neon PostgreSQL backend
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
- **Server state:** Firebase/Firestore for cloud sync (optional)

### Data Flow
```
User Action → Component → localStorage → (optional) Firebase Sync
                    ↓
               Context Update → Re-render
```

### View State Management
The app uses a single `view` state in App.tsx to control the main view:
```typescript
type ViewState = 'LANDING' | 'SHOP' | 'CUSTOMER' | 'CUSTOMIZER' | 
                 'CART' | 'ADMIN_DASHBOARD' | 'CLIENT_DASHBOARD' | 
                 'FONTS_SHOWCASE' | 'PUBLIC_TRACKING' | 'TRACKING'
```

### Authentication Flow
1. Auth disabled in development (hardcoded admin user)
2. Production: Firebase Auth with Email, Google, and Anonymous options
3. Admin detection: Hardcoded emails + dynamic list from store config
4. Guest users: Anonymous auth with phone-based lookup

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
Add `?debugbg=1` to URL to reveal background overlays for debugging.

---

## Security Considerations

### Firebase Configuration
- Production credentials are hardcoded in `firebaseConfig.ts`
- Can be overridden via `localStorage` for development
- Validation ensures API keys start with "AIza"

### Rate Limiting
- In-memory attempt tracking for auth operations
- 5 attempts per minute window
- Client identifier stored in `sessionStorage`

### Input Validation
- Phone number normalization (10 digits + 52 prefix for MX)
- Order ID format: `LM-{sequential number}`
- Email validation via Firebase Auth

### Admin Access
- Hardcoded admin emails in `services/auth.ts`
- Dynamic admin list from store config (localStorage)
- Role-based UI rendering (`user.role === UserRole.ADMIN`)

### Environment Variables
**NEVER commit `.env.local` to git.** The following are sensitive:
- `GROQ_API_KEY`
- `DATABASE_URL`
- Firebase credentials (if using env vars)

---

## Database Schema (PostgreSQL)

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
Add `?debugbg=1` to URL to reveal overlay issues. Check `--app-bg` CSS variable.

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
