// 最小 Supabase demo：读 / 写 guestbook 表。Node 22+（原生 fetch/WebSocket，无需 ws）。
// 用法: node --env-file=.env demo.mjs [bj|hz] [list|post] [留言内容...]
import { createClient } from '@supabase/supabase-js';

// 环境变量名按平台实际注入写死（北京 suffix 格式 / 杭州 prefix 格式）
const INSTANCES = {
  bj: { url: 'NEXT_PUBLIC_SUPABASE_URL_HTTP_M6T1', key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY_M6T1' },
  hz: { url: 'XGD4_SUPABASE_URL_HTTP', key: 'XGD4_SUPABASE_ANON_KEY' },
};

const region = INSTANCES[process.argv[2]] ? process.argv[2] : 'bj';
const action = process.argv[3] === 'post' ? 'post' : 'list';
const def = INSTANCES[region];
const url = process.env[def.url];
const key = process.env[def.key];
if (!url || !key) {
  console.error(`缺少环境变量 ${def.url} / ${def.key}`);
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const table = process.env.SUPABASE_TABLE || 'guestbook';

if (action === 'list') {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(20);
  if (error) { console.error('读取失败:', error.message); process.exit(1); }
  console.log(`[${region}] ${table} 共 ${data.length} 条`);
  for (const r of data) console.log(`- ${r.name}: ${r.message}`);
} else {
  const message = process.argv.slice(4).join(' ') || 'hello from supabase-demo';
  const { data, error } = await supabase.from(table).insert({ name: 'demo', message }).select();
  if (error) { console.error('写入失败:', error.message); process.exit(1); }
  console.log(`[${region}] 已写入:`, data[0]);
}