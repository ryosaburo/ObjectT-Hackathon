const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const mecab = require('../mecab');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/word.db');
const db = new Database(dbPath, { readonly: true });

// GET /api/words?q=...&tag=...&rhyme=...&limit=20&offset=0
// DB から単語一覧を取得して返す（タグはカンマ区切りで返す）
router.get('/words', (req, res) => {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    const tag = req.query.tag;
    const rhyme = req.query.rhyme;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    let sql = `SELECT w.id, w.text, w.normalized, w.reading, w.pos, w.syllables, w.rhyme_key, w.popularity, w.complexity, w.created_at, GROUP_CONCAT(t.name) as tags
      FROM words w
      LEFT JOIN word_tags wt ON wt.word_id = w.id
      LEFT JOIN tags t ON t.id = wt.tag_id`;

    const where = [];
    const params = [];
    if (q) {
      where.push('w.normalized LIKE ?');
      params.push(`%${q}%`);
    }
    if (rhyme) {
      where.push('w.rhyme_key = ?');
      params.push(rhyme);
    }
    if (tag) {
      where.push('w.id IN (SELECT wt2.word_id FROM word_tags wt2 JOIN tags t2 ON t2.id = wt2.tag_id WHERE t2.name = ?)');
      params.push(tag);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY w.id ORDER BY w.popularity DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    // tags は null の場合があるので配列化
    const result = rows.map(r => ({ ...r, tags: r.tags ? r.tags.split(',') : [] }));
    return res.json({ ok: true, data: result });
  } catch (err) {
    console.error('GET /api/words error', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

// GET /api/words/:id -> 単語詳細（examples, tags を含む）
router.get('/words/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, error: 'invalid_id' });

    const word = db.prepare(`SELECT * FROM words WHERE id = ?`).get(id);
    if (!word) return res.status(404).json({ ok: false, error: 'not_found' });

    const tagsRow = db.prepare(`SELECT t.name FROM tags t JOIN word_tags wt ON wt.tag_id = t.id WHERE wt.word_id = ?`).all(id);
    const examples = db.prepare(`SELECT id, sentence, author, created_at FROM examples WHERE word_id = ? ORDER BY created_at DESC`).all(id);
    const tags = tagsRow.map(r => r.name);

    return res.json({ ok: true, data: { ...word, tags, examples } });
  } catch (err) {
    console.error('GET /api/words/:id error', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

// POST /api/words/suggest
// body: { text: string, rhyme?: boolean, limit?: number }
// 入力テキストから読み／ライムキーを抽出し、同じライムキーの単語候補を返す
router.post('/words/suggest', async (req, res) => {
  try {
    const text = (req.body && req.body.text) ? String(req.body.text) : null;
    if (!text) return res.status(400).json({ ok: false, error: 'text_required' });

    const reading = await mecab.getReading(text);
    const rhymeKey = mecab.extractRhymeKeyFromReading(reading);
    if (!rhymeKey) return res.json({ ok: true, data: [] });

    const limit = Math.min(parseInt(req.body.limit || '20', 10), 100);
    const rows = db.prepare(`SELECT w.id, w.text, w.reading, w.rhyme_key, w.popularity, GROUP_CONCAT(t.name) as tags
      FROM words w
      LEFT JOIN word_tags wt ON wt.word_id = w.id
      LEFT JOIN tags t ON t.id = wt.tag_id
      WHERE w.rhyme_key = ?
      GROUP BY w.id
      ORDER BY w.popularity DESC
      LIMIT ?`).all(rhymeKey, limit);

    const result = rows.map(r => ({ ...r, tags: r.tags ? r.tags.split(',') : [] }));
    return res.json({ ok: true, data: result, meta: { rhymeKey } });
  } catch (err) {
    console.error('POST /api/words/suggest error', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

module.exports = router;
