# Persistence foundation

001_records.sql is additive. No DROP/REPLACE, no import and no demo seed. A collision aborts transaction. Admin membership is a server table, not editable by customers or inferred from email. RLS protects private records and each user's own data. Only product/font catalog projections are public. Do not store bank details, customer contact or credentials in those two payloads. Fonts preserve original cssFamily, categories and uploaded fileData.

This foundation does not implement trusted checkout, stock reservation, loyalty or customer identity linkage. lm_orders is staff-only until those workflows exist. Client order visibility needs authenticated owner mapping, not phone search over all orders. Checkout must never fall back to localStorage claiming received. Other modules use per-record revision guards; no global store overwrite. Public store branding requires a deliberate allowlisted projection, not publishing store_private.
