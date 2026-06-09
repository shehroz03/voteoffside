import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { matchId, winnerTeamCode } = req.body;
  const adminPassword = req.headers['x-admin-password'];

  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Server configuration missing' });
  }

  const adminSupabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data, error } = await adminSupabase.rpc('settle_match', {
      matchid: matchId,
      winnerteamcode: winnerTeamCode
    });

    if (error) throw error;

    return res.status(200).json({ success: true, message: `Match ${matchId} settled successfully!` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
