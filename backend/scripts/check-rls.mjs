import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const rls = await client.query(
  "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND rowsecurity=true ORDER BY tablename"
);
console.log('\n✅ Tables with RLS enabled:');
console.table(rls.rows);

const pol = await client.query(
  "SELECT tablename, COUNT(*) as policy_count FROM pg_policies WHERE schemaname='public' GROUP BY tablename ORDER BY tablename"
);
console.log('\n✅ Policy counts per table:');
console.table(pol.rows);

const enableRlsCheck = await client.query(
  "SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity=false AND tablename IN ('users','wallets','transactions','subscriptions','subscription_tiers','content_unlocks','shorts','posts','live_streams') ORDER BY tablename"
);
if (enableRlsCheck.rows.length > 0) {
  console.log('\n⚠️  Tables WITHOUT RLS (from enable_row_level_security.sql):');
  console.table(enableRlsCheck.rows);
} else {
  console.log('\n✅ All key tables have RLS enabled');
}

await client.end();
