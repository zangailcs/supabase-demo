// Supabase demo（全根目录、无子文件夹）：express 后端，ESA 靠 express 依赖识别为 backend。
// GET /api/guestbook?region=bj|hz 读列表；POST /api/guestbook {region,name,message} 写入。
import express from 'express';
import { createClient } from '@supabase/supabase-js';

// 环境变量名按平台实际注入写死（北京 suffix 格式 / 杭州 prefix 格式）
const INSTANCES = {
  bj: { url: 'CA5D_SUPABASE_URL', key: 'CA5D_SUPABASE_ANON_KEY' },
  hz: { url: 'XGD4_SUPABASE_URL_HTTP', key: 'XGD4_SUPABASE_ANON_KEY' },
};
const clients = {};
function getClient(region = 'bj') {
  const r = INSTANCES[region] ? region : 'bj';
  const def = INSTANCES[r];
  if (!clients[r]) {
    const url = process.env[def.url];
    const key = process.env[def.key];
    if (!url || !key) throw new Error(`Supabase(${r}) 未配置：缺少 ${def.url} / ${def.key}`);
    clients[r] = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return clients[r];
}
const table = (region = 'bj') => process.env['SUPABASE_TABLE_' + region.toUpperCase()] || process.env.SUPABASE_TABLE || 'guestbook';

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'supabase-demo' }));

app.get('/api/guestbook', async (req, res) => {
  const region = req.query.region === 'hz' ? 'hz' : 'bj';
  try {
    const { data, error } = await getClient(region).from(table(region)).select('*').order('created_at', { ascending: false }).limit(50);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, region, rows: data });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/guestbook', async (req, res) => {
  const region = req.body?.region === 'hz' ? 'hz' : 'bj';
  const message = String(req.body?.message || '').trim();
  if (!message) return res.status(400).json({ ok: false, error: 'message 不能为空' });
  try {
    const { data, error } = await getClient(region).from(table(region))
      .insert({ name: String(req.body?.name || 'demo').slice(0, 40), message }).select();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    res.json({ ok: true, region, row: data[0] });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));
