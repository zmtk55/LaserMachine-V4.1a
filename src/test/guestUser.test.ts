import { describe, it, expect, vi, beforeEach } from 'vitest';
const { signInAnonymously } = vi.hoisted(() => ({ signInAnonymously: vi.fn() }));
vi.mock('../../services/supabaseClient', () => ({ supabase: { auth: { signInAnonymously }, rpc: vi.fn(), from: vi.fn() } }));
vi.mock('../../services/turnstile', () => ({ getCaptchaToken: vi.fn(async () => 'tok-prueba') }));
import { createGuestUser } from '../../services/supabaseAuth';
describe('createGuestUser', () => {
  beforeEach(() => signInAnonymously.mockReset());
  it('abre sesion anonima con captchaToken y datos de contacto, sin rol admin', async () => {
    signInAnonymously.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null });
    const u = await createGuestUser('6371234567', 'Ana Perez');
    expect(signInAnonymously).toHaveBeenCalledWith({ options: { captchaToken: 'tok-prueba', data: { name: 'Ana Perez', phone: '6371234567' } } });
    expect(u).toMatchObject({ id: 'u-1', isGuest: true, phone: '6371234567', laserPoints: 0, email: '' });
    expect(u.role).not.toBe('ADMIN');
  });
  it('error del servidor da mensaje claro sin filtrar detalle', async () => {
    signInAnonymously.mockResolvedValue({ data: { user: null }, error: { message: 'Anonymous sign-ins are disabled' } });
    await expect(createGuestUser('6371234567', 'Ana')).rejects.toThrow(/invitado/);
  });
});
