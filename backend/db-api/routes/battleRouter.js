const express = require('express');
// 新しいルーターインスタンスを作成
const router = express.Router(); 

// /api/battle のパスに続くエンドポイントを定義
router.get('/', (req, res) => {
    res.send('Welcome to the Rap Battle API!');
});

router.post('/evaluate', (req, res) => {
    // ラップ評価ロジックを呼び出す (db-api/logic)
    res.json({ score: 90, result: 'Player Wins' });
});

module.exports = router;