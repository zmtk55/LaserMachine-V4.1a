
import { db } from '../firebaseConfig';
import { doc, writeBatch, setDoc } from 'firebase/firestore';
import { Product, FontOption, StoreConfig, Order } from '../types';

// Helper para procesar por lotes (Firestore limite: 500 operaciones por batch)
const processInBatches = async (items: any[], collectionName: string, idField: string = 'id') => {
    if (!db) throw new Error("Firebase DB not initialized");
    
    const CHUNK_SIZE = 450; // Margen de seguridad bajo el límite de 500
    const chunks = [];

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    let batchCount = 0;
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((item) => {
            // Asegurar que el ID sea string
            const docId = String(item[idField]);
            const ref = doc(db, collectionName, docId);
            batch.set(ref, item);
        });
        await batch.commit();
        batchCount++;
        console.log(`Lote ${batchCount}/${chunks.length} de ${collectionName} migrado.`);
    }
};

export const migrateProductsToCloud = async (products: Product[]) => {
    await processInBatches(products, 'products', 'id');
};

export const migrateFontsToCloud = async (fonts: FontOption[]) => {
    await processInBatches(fonts, 'fonts', 'id');
};

export const migrateOrdersToCloud = async (orders: Order[]) => {
    await processInBatches(orders, 'orders', 'id');
};

export const migrateConfigToCloud = async (config: StoreConfig) => {
    if (!db) throw new Error("Firebase DB not initialized");
    // La configuración es un solo documento, no necesita batch
    await setDoc(doc(db, 'config', 'main'), config);
};
