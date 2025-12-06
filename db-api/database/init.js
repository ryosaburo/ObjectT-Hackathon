// 初期化スクリプト: このスクリプトを実行すると同ディレクトリに `word.db` が作成され、rapバトル向けのスキーマとサンプルデータが挿入されます。
// 事前に依存パッケージをインストールしてください: better-sqlite3

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'word.db');
// 既存ファイルがあれば上書きしたくない場合はコメントアウト
if (fs.existsSync(dbPath)) {
  console.log('既存の word.db が存在します。上書きします。');
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);

// 外部キー有効化
db.pragma('foreign_keys = ON');

// スキーマ定義: rapバトル向けの語彙DB
// - words: 単語／フレーズの主要情報（韻, 品詞, 音節数など）
// - tags: ジャンルやカテゴリ（攻撃, ディス, メタファー など）
// - word_tags: 多対多関係
// - relations: 同義語/対義語などの関係
// - examples: 使用例（バースの一節など）
// - audio_samples: 発音やビートに合わせたサンプル
// - submissions: ユーザーが提案した単語（承認ワークフロー用）

db.exec(`
BEGIN;

CREATE TABLE words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,                -- 表記
  normalized TEXT NOT NULL,          -- 検索用に正規化した表記（小文字など）
  reading TEXT,                      -- 読み（発音）
  meaning TEXT,                      -- 意味や注釈
  pos TEXT,                          -- 品詞 (noun, verb, adj...)
  syllables INTEGER DEFAULT NULL,    -- 音節数（韻律解析で使用）
  rhyme_key TEXT,                    -- ライム判定用のキー（例: 最後の母音以降）
  complexity INTEGER DEFAULT 0,      -- 難易度 / 使用難易度
  popularity INTEGER DEFAULT 0,      -- 使用頻度やスコア
  created_at DATETIME DEFAULT (datetime('now')),
  updated_at DATETIME
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE word_tags (
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (word_id, tag_id)
);

CREATE TABLE relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  related_word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'synonym', 'antonym', 'assonance', 'consonance', 'slang'
  note TEXT
);

CREATE TABLE examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL,
  author TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE audio_samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word_id INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user TEXT,
  text TEXT NOT NULL,
  normalized TEXT NOT NULL,
  reading TEXT,
  meaning TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at DATETIME DEFAULT (datetime('now'))
);

-- インデックス
CREATE INDEX idx_words_normalized ON words(normalized);
CREATE INDEX idx_words_rhyme_key ON words(rhyme_key);
CREATE INDEX idx_tags_name ON tags(name);

COMMIT;
`);

// サンプルデータの挿入（ほんの少し）
const insertWord = db.prepare(`INSERT INTO words (text, normalized, reading, meaning, pos, syllables, rhyme_key, complexity, popularity, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`);
const insertTag = db.prepare(`INSERT OR IGNORE INTO tags (name) VALUES (?)`);
const linkTag = db.prepare(`INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)`);

const sampleWords = [
  { text: 'Flow', normalized: 'flow', reading: 'フロー', meaning: '音の流れ、韻の運び', pos: 'noun', syllables: 1, rhyme_key: 'o' },
  { text: 'Mic', normalized: 'mic', reading: 'マイク', meaning: 'マイクロフォン', pos: 'noun', syllables: 1, rhyme_key: 'aik' },
  { text: 'Freestyle', normalized: 'freestyle', reading: 'フリースタイル', meaning: '即興ラップ', pos: 'noun', syllables: 3, rhyme_key: 'le' },
  { text: 'Burn', normalized: 'burn', reading: 'バーン', meaning: '攻撃的なライン（ディス）', pos: 'verb', syllables: 1, rhyme_key: 'urn' }
];

const sampleTags = ['attack', 'praise', 'metaphor', 'flow', 'slang'];

const insertExample = db.prepare(`INSERT INTO examples (word_id, sentence, author) VALUES (?, ?, ?)`);

const tx = db.transaction(() => {
  for (const t of sampleTags) insertTag.run(t);

  for (const w of sampleWords) {
    const info = insertWord.run(w.text, w.normalized, w.reading, w.meaning, w.pos, w.syllables, w.rhyme_key, 1, 0);
    const wordId = info.lastInsertRowid;
    // シンプルにタグを1つずつ付ける
    linkTag.run(wordId, 1); // 'attack' を全てに付けておく（例）
    insertExample.run(wordId, `${w.text} を使ったバースの例: ここで決めるぜ ${w.text}`, 'seed');
  }

  // relations の例: 'Burn' は 'Diss' に近い表現とするため同義関係を作る（もし DISS が存在すれば）
});

tx();

console.log('word.db を作成しました:', dbPath);

db.close();
