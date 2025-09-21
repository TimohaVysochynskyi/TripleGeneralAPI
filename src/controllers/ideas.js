import { sendIdeaToTelegram } from '../services/ideas.js';

export async function postIdea(req, res) {
  const { name, telegram, idea } = req.body;
  await sendIdeaToTelegram({ name, telegram, idea });
  res.json({ ok: true });
}
