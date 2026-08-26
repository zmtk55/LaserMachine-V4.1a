"""Smoke-test the deployed app's auth flows via Supabase REST."""
import json
import urllib.request

URL = 'https://pzuyfpquznaxzrlqzxpo.supabase.co'
KEY = 'sb_publishable_OLtNkYQKWxc-26v1zUZLeA_q0zitI0j'


def req(path, method='GET', body=None, token=None):
    headers = {'apikey': KEY, 'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(f'{URL}{path}', data=data, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=30)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


ok, fail = '\u2705', '\u274c'

s, b = req('/rest/v1/products?select=id,name&limit=2')
print(f'{ok if s == 200 else fail} products (anon) -> HTTP {s} {b[:100]}')

s, b = req('/auth/v1/settings')
if s == 200:
    st = json.loads(b)
    ext = st.get('external', {})
    print(f'{ok if s == 200 else fail} auth settings -> google={ext.get("google")}, anonymous={st.get("external", {}).get("anonymous_users")}, signup_disabled={st.get("disable_signup")}, autoconfirm={st.get("mailer_autoconfirm")}')
else:
    print(f'{fail} /auth/v1/settings -> HTTP {s}')

# email signup test (checks confirm-email setting + DB trigger health)
email = f'smkuser{int(__import__("time").time())}@gmail.com'
s, b = req('/auth/v1/signup', 'POST', {'email': email, 'password': 'Test1234!'})
sign_ok = ok if s == 200 else fail
print(f'{sign_ok} email signup -> HTTP {s} {b[:150]}')

try:
    token = json.loads(b).get('access_token')
except Exception:
    token = None

if token:
    s, b = req('/rest/v1/customers', 'POST',
               {'name': 'Smoke Test', 'phone': f'55{int(__import__("time").time()) % 10**10}', 'laser_points': 10},
               token=token)
    print(f'{ok if s in (200, 201) else fail} customers insert (authenticated, RLS) -> HTTP {s} {b[:120]}')
else:
    print('  (no session: email confirmation required - normal unless autoconfirm is on)')
