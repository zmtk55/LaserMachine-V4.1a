/**
 * Setup completo de Strapi con nuevo token
 */

const STRAPI_URL = 'http://localhost:1337';
const API_TOKEN = 'bce3b162ab2c964aec2e0991c8514d677fbf6237a441f08cc493f430252259344af0cb22d8a42dc0175e98b070ac67017b86231261ae32495bce0c0532b5f1169b4187ad8971b355d6c7b77ea4efc0cb1ebd01e0bbd767f9e97da3a6f2fb5719bf7fa4e4d1357da00299fb994e41c304a9aecf9213dc22bc4f18485402003177';

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) options.body = JSON.stringify(data);
  
  const response = await fetch(`${STRAPI_URL}/api${endpoint}`, options);
  return response;
}

async function checkStatus() {
  console.log('🔍 Verificando estado actual...\n');
  
  const endpoints = ['/products', '/orders', '/coupons', '/store-config', '/product-colors'];
  
  for (const ep of endpoints) {
    try {
      const res = await apiCall(ep);
      if (res.status === 200) {
        const data = await res.json();
        console.log(`✅ ${ep} - OK (${data.data?.length || 0} items)`);
      } else if (res.status === 404) {
        console.log(`❌ ${ep} - NO EXISTE`);
      } else if (res.status === 403) {
        console.log(`⚠️  ${ep} - Sin permisos`);
      } else {
        console.log(`⚠️  ${ep} - HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`❌ ${ep} - Error: ${e.message}`);
    }
  }
}

async function createStoreConfig() {
  console.log('\n🔄 Creando Store Config...');
  try {
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
        logoSurcharge: 50,
        bankInfo: 'H.CABORCA SONORA MEXICO\nCALLE 9 AV, L N79\nCP 83600'
      }
    });
    if (res.ok) {
      console.log('✅ Store Config creado');
    } else {
      console.log(`❌ Error: HTTP ${res.status}`);
    }
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }
}

async function createCoupons() {
  console.log('\n🔄 Creando cupones de ejemplo...');
  const coupons = [
    { code: 'BIENVENIDO', type: 'PERCENTAGE', value: 10, description: '10% de descuento en tu primera compra' },
    { code: 'DESCUENTO50', type: 'FIXED', value: 50, description: '$50 de descuento', minOrderAmount: 500 }
  ];
  
  for (const coupon of coupons) {
    try {
      const res = await apiCall('/coupons', 'POST', { data: coupon });
      if (res.ok) {
        console.log(`✅ Cupón ${coupon.code} creado`);
      } else {
        console.log(`❌ Cupón ${coupon.code}: HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`❌ Cupón ${coupon.code}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Setup Completo de Strapi\n');
  
  await checkStatus();
  await createStoreConfig();
  await createCoupons();
  
  console.log('\n✨ Proceso finalizado');
  console.log('\n📋 Si faltan content types, créalos en:');
  console.log('   Admin → Content-Type Builder → Create new collection type');
}

main().catch(console.error);
