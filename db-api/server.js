const express = require('express');
const app = express();
const cors = require('cors');

// ルーター（ファイル名に合わせて require）
const battleRouter = require('./routes/battleRouter');
const wordsRouter = require('./routes/words'); // 単語リスト取得用ルーター（db-api/routes/words.js）

// ミドルウェア
app.use(cors());
app.use(express.json());

// --------------------------------------------------
// ルーターのマウント
// --------------------------------------------------

// /api/battle に battleRouter をマウント
app.use('/api/battle', battleRouter);

// 単語ルーターは /api にマウントすることで
// words.js 内の '/words', '/words/:id', '/words/suggest' が
// 結果的に '/api/words', '/api/words/:id', '/api/words/suggest' となります。
app.use('/api', wordsRouter);

// 簡易エラーハンドラ
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});