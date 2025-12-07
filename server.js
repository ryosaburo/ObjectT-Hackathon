const express = require('express');
const app = express();
const cors = require('cors');

// ルーター（db-api にある routes を使用）
const battleRouter = require('./db-api/routes/battleRouter');
const wordsRouter = require('./db-api/routes/words');

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルーターをマウント
app.use('/api/battle', battleRouter);
// wordsRouter は内部で '/words' '/words/:id' '/words/suggest' を定義しているため
// ここでは '/api' にマウントして '/api/words' などのエンドポイントを提供する
app.use('/api', wordsRouter);

// 簡易エラーハンドラ
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});