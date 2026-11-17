import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import InventoryManager from '../../components/InventoryManager';
import { Product } from '../../types';

const sinColores: Product = { id: 'termo-generico-20oz', name: 'Termo 20oz con grabado', brand: 'GENÉRICO' as any, category: 'Termos', price: 350, stockThreshold: 5, imageUrl: '/x.svg', colors: [], engravingIncluded: true, illustrativeImage: true } as any;
const agotadoReal: Product = { id: 'yeti-1', name: 'Yeti confirmado', brand: 'GENÉRICO' as any, category: 'Termos', price: 900, stockThreshold: 5, imageUrl: '/y.svg', colors: [{ id: 'negro', name: 'NEGRO', hex: '#18181b', stock: 0, imageUrl: '/y.svg' }] } as any;
const props = { categories: ['Termos'], globalColors: [], onAddProduct: vi.fn(), onUpdateProduct: vi.fn(), onDeleteProduct: vi.fn(), onBulkDistributor: vi.fn() };

afterEach(cleanup);

describe('inventario sin colores confirmados', () => {
  it('producto sin colores se muestra como Inventario por confirmar, no Sin Stock', () => {
    render(<InventoryManager products={[sinColores]} {...props} />);
    expect(screen.getByText('Inventario por confirmar')).toBeTruthy();
    expect(screen.queryByText('Sin Stock')).toBeNull();
    expect(screen.getByText('1 por confirmar')).toBeTruthy();
    expect(screen.getByText(/0 con stock bajo · 0 agotados/)).toBeTruthy();
  });
  it('producto con color confirmado en 0 sí aparece como Sin Stock y cuenta como agotado', () => {
    render(<InventoryManager products={[agotadoReal]} {...props} />);
    expect(screen.getByText('Sin Stock')).toBeTruthy();
    expect(screen.queryByText('Inventario por confirmar')).toBeNull();
    expect(screen.getByText(/0 con stock bajo · 1 agotados/)).toBeTruthy();
  });
  it('filtro Agotados excluye sin-colores; filtro Por confirmar lo incluye', () => {
    render(<InventoryManager products={[sinColores, agotadoReal]} {...props} />);
    const select = screen.getAllByRole('combobox').find(el => (el as HTMLSelectElement).value === 'ALL')!;
    fireEvent.change(select, { target: { value: 'OUT' } });
    expect(screen.getByText('Yeti confirmado')).toBeTruthy();
    expect(screen.queryByText('Termo 20oz con grabado')).toBeNull();
    fireEvent.change(select, { target: { value: 'PENDING' } });
    expect(screen.getByText('Termo 20oz con grabado')).toBeTruthy();
    expect(screen.queryByText('Yeti confirmado')).toBeNull();
  });
});
