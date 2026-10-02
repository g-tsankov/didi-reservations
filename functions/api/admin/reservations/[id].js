import { json, fail, parseId } from '../../../../lib/http.js';

export async function onRequestDelete({ env, params }) {
  const id = parseId(params.id);
  if (!id) return fail('not_found', 404);

  const res = await env.DB.prepare('DELETE FROM reservations WHERE id = ?1').bind(id).run();
  if (res.meta.changes === 0) return fail('not_found', 404);
  return json({ ok: true });
}
