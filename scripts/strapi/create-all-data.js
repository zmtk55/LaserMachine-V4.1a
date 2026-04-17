const API_URL = 'https://lasermachine-strapi-production.up.railway.app/api';
const TOKEN = '997d143e7ba8a7d6d81b69449f9dfcad86c23ddf6502e7fab1cfccc959762aafea21894d059a425fb5aede53f31415d811d2954b48b29ebcc702ced52cd425f0732d2c293a7cef357ff98a55d9897d1b7cd29ad262ed8715c74159ef8e2af0e20d1331ff346035a32521d7140e55515a1f4dcf393f7ea951f2cc0d1ebe2ecbde';

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  if (data) options.body = JSON.stringify(data);
  
  const res = await fetch(`${API_URL}${endpoint}`, options);
  return res;
}

const products = [
  { name: 'Rambler 20oz', brand: 'YETI', category: 'Tumblers', price: 850, stockThreshold: 10, isActive: true },
  { name: 'Travel Mug 30oz', brand: 'YETI', category: 'Travel', price: 950, stockThreshold: 8, isActive: true },
  { name: 'Quencher 40oz', brand: 'Stanley', category: 'Tumblers', price: 1200, stockThreshold: 5, isActive: true },
  { name: 'IceFlow 30oz', brand: 'Stanley', category: 'Bottles', price: 980, stockThreshold: 6, isActive: true },
  { name: 'Wide Mouth 32oz', brand: 'HidroFlask', category: 'Bottles', price: 890, stockThreshold: 10, isActive: true },
  { name: 'Coffee Mug 12oz', brand: 'HidroFlask', category: 'Tazas', price: 650, stockThreshold: 8, isActive: true },
  { name: 'FreeSip 24oz', brand: 'OWALA', category: 'Bottles', price: 720, stockThreshold: 5, isActive: true },
  { name: 'FreeSip 32oz', brand: 'OWALA', category: 'Bottles', price: 820, stockThreshold: 5, isActive: true },
  { name: 'Skinny Tumbler', brand: 'Generico', category: 'Tumblers', price: 350, stockThreshold: 20, isActive: true },
  { name: 'Wine Tumbler', brand: 'Generico', category: 'Accesorios', price: 280, stockThreshold: 15, isActive: true }
];

async function createProducts() {
  console.log('🔄 Creando productos...\n');
  for (const p of products) {
    const res = await apiCall('/products', 'POST', { data: p });
    console.log(res.ok ? `✅ ${p.name}` : `❌ ${p.name}: ${res.status}`);
  }
}

async function createStoreConfig() {
  console.log('\n🔄 Creando Store Config...');
  const res = await apiCall('/store-config', 'POST', {
    data: {
      businessName: 'LASERMACHINE',
      accentColor: '#f59e0b',
      nextOrderId: 1000,
      pointsPercentage: 5,
      whatsapp: '526371247095',
      facebookUrl: 'lasermachinemexico',
      baseEngravingPrice: 100,
      extraSidePrice: 50,
      logoSurcharge: 50
    }
  });
  console.log(res.ok ? '✅ Store Config creado' : `❌ Error: ${res.status}`);
}

async function createCoupons() {
  console.log('\n🔄 Creando cupones...');
  const coupons = [
    { code: 'BIENVENIDO', type: 'PERCENTAGE', value: 10, isActive: true },
    { code: 'DESCUENTO50', type: 'FIXED', value: 50, minOrderAmount: 500, isActive: true }
  ];
  for (const c of coupons) {
    const res = await apiCall('/coupons', 'POST', { data: c });
    console.log(res.ok ? `✅ Cupón ${c.code}` : `❌ Cupón ${c.code}: ${res.status}`);
  }
}

async function main() {
  console.log('🚀 Creando todos los datos en Strapi\n');
  await createProducts();
  await createStoreConfig();
  await createCoupons();
  console.log('\n✨ Listo!');
}

main().catch(console.error);
