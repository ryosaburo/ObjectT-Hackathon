// db-api/database/import_words.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const mecab = require('../mecab');

if (process.argv.length < 3) {
  console.error('使い方: node import_words.js <tsv-file>');
  process.exit(1);
}
const tsvPath = path.resolve(process.argv[2]);
if (!fs.existsSync(tsvPath)) {
  console.error('TSV ファイルが見つかりません:', tsvPath);
  process.exit(1);
}

const dbPath = path.join(__dirname, 'word.db');
if (!fs.existsSync(dbPath)) {
  console.error('word.db が見つかりません:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);
const insertWord = db.prepare(`INSERT INTO words (text, normalized, reading, meaning, pos, syllables, rhyme_key, complexity, popularity, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
const insertTag = db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`);
const getTagId = db.prepare(`SELECT id FROM tags WHERE name = ?`);
const linkTag = db.prepare(`INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)`);
const findExisting = db.prepare(`SELECT id FROM words WHERE normalized = ? LIMIT 1`);

const lines = fs.readFileSync(tsvPath, 'utf8').split(/\r?\n/).filter(Boolean);
if (lines.length === 0) {
  console.error('TSV が空です');
  process.exit(1);
}

// ヘッダをスキップしてパース
const header = lines.shift().split('\t').map(h => h.trim());

// TSV をオブジェクト配列に変換
const parsedRows = lines.map((row) => {
  const cols = row.split('\t');
  return {
    raw: row,
    cols,
    text: (cols[0] || '').trim(),
    normalized: (cols[1] || '').trim(),
    reading: (cols[2] || '').trim(),
    meaning: (cols[3] || '').trim(),
    pos: (cols[4] || '').trim(),
    syllables: (cols[5] && cols[5].trim()) ? parseInt(cols[5].trim(), 10) : null,
    rhyme_key: (cols[6] || '').trim(),
    complexity: (cols[7] && cols[7].trim()) ? parseInt(cols[7].trim(), 10) : 0,
    popularity: (cols[8] && cols[8].trim()) ? parseInt(cols[8].trim(), 10) : 0,
    tagsStr: (cols[9] || '').trim()
  };
});

(async () => {
  // MeCab で事前解析（順次処理）。数十件ならこの方法で十分。
  for (const r of parsedRows) {
    if (!r.text) {
      console.warn('スキップ: text 空 ->', r.raw);
      continue;
    }

    try {
      // normalized が空なら MeCab の normalize を使う
      if (!r.normalized) {
        try {
          r.normalized = await mecab.normalize(r.text);
        } catch (err) {
          console.warn('normalize 失敗, フォールバック raw:', r.text, err && err.message ? err.message : err);
          r.normalized = r.text.toLowerCase();
        }
      }

      // reading が空なら取得
      if (!r.reading) {
        try {
          r.reading = await mecab.getReading(r.text);
        } catch (err) {
          console.warn('getReading 失敗:', r.text, err && err.message ? err.message : err);
          r.reading = null;
        }
      }

      // 音節数（モーラ推定）
      if (!r.syllables && r.reading) {
        try {
          const mora = mecab.countMoraFromKatakana(r.reading);
          r.syllables = mora || null;
        } catch (err) {
          r.syllables = null;
        }
      }

      // rhyme_key が空なら抽出
      if (!r.rhyme_key && r.reading) {
        try {
          r.rhyme_key = mecab.extractRhymeKeyFromReading(r.reading);
        } catch (err) {
          r.rhyme_key = null;
        }
      }
    } catch (err) {
      console.warn('解析中に予期せぬエラー, 続行します:', err && err.message ? err.message : err);
    }
  }

  // トランザクションで一括挿入
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      // 既に text が空の行などはスキップ
      if (!r || !r.text) continue;

      // 重複チェック（normalized）
      const check = r.normalized ? findExisting.get(r.normalized) : null;
      if (check) {
        console.log('既存のためスキップ:', r.normalized || r.text);
        continue;
      }

      const info = insertWord.run(
        r.text,
        r.normalized || r.text.toLowerCase(),
        r.reading || null,
        r.meaning || null,
        r.pos || null,
        r.syllables,
        r.rhyme_key || null,
        r.complexity || 0,
        r.popularity || 0
      );
      const wordId = info.lastInsertRowid;

      const tags = r.tagsStr ? r.tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
      for (const t of tags) {
        insertTag.run(t);
        const tid = getTagId.get(t);
        if (tid && tid.id) linkTag.run(wordId, tid.id);
      }
    }
  });

  try {
    tx(parsedRows);
    console.log('インポート完了');
  } catch (err) {
    console.error('インポート中にエラー:', err && err.message ? err.message : err);
  } finally {
    db.close();
  }
})();