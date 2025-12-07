// MeCab ラッパー（Node.js 用）
// 使い方:
// 1) システムに MeCab と辞書をインストール
// 2) npm install mecab-async
// 3) const mecab = require('./db-api/mecab');
//    await mecab.parse('寿司が食べたい');

const Mecab = require('mecab-async');

class MecabWrapper {
  constructor() {
    this.mecab = new Mecab();
  }

  parse(text) {
    return new Promise((resolve, reject) => {
      this.mecab.parse(text, (err, result) => {
        if (err) return reject(err);
        // result は配列: [ [surface, feature], ... ] の形式のパッケージもあるため、安全にマップする
        // mecab-async は各行を配列で返すことが多い: [ ["寿司", "名詞,一般,*,*,*,*,寿司,スシ,スシ"], ...]
        const tokens = result
          .filter(Boolean)
          .map(item => {
            if (Array.isArray(item) && item.length >= 2) {
              const surface = item[0];
              const features = (item[1] || '').split(',');
              return {
                surface,
                pos: features[0] || null,
                pos_detail: features.slice(0, 3).join(','),
                inflection: features[4] || null,
                base: features[6] || features[0] || surface,
                reading: features[7] || null,
                pron: features[8] || null,
                raw: item[1]
              };
            }
            // まれに文字列で返ることもある
            return { surface: String(item), raw: item };
          });
        resolve(tokens);
      });
    });
  }

  // 正規化: base（基本形）を連結して小文字化
  async normalize(text) {
    const tokens = await this.parse(text);
    return tokens.map(t => (t.base || t.surface).toLowerCase()).join(' ');
  }

  // 読みを取得（カタカナが返る想定）
  async getReading(text) {
    const tokens = await this.parse(text);
    const readings = tokens.map(t => t.reading || t.surface);
    return readings.join('');
  }

  // 仮のモーラ（拍）数をカタカナの読みから推定
  countMoraFromKatakana(katakana) {
    if (!katakana) return 0;
    // 小書き仮名は前の音に付随するので除外
    const smallKana = /[ァィゥェォャュョ]/g;
    // 長音符 'ー' は母音の伸びだが1モーラとして数える
    // 撥音 'ン' や促音 'ッ' はそれぞれ1モーラ
    const cleaned = katakana.replace(smallKana, '');
    // 何文字残っているかを数える簡易方法
    return Array.from(cleaned).length;
  }

  // ライム判定用キー（最後の1〜2モーラを返す簡易実装）
  extractRhymeKeyFromReading(reading) {
    if (!reading) return null;
    // カタカナのみ抽出
    const kana = reading.replace(/[^\u30A0-\u30FFー]/g, '');
    // 小書き仮名は無視して終端の2文字を返す（簡易）
    const smallKana = /[ァィゥェォャュョ]/g;
    const cleaned = kana.replace(smallKana, '');
    if (cleaned.length <= 2) return cleaned;
    return cleaned.slice(-2);
  }
}

module.exports = new MecabWrapper();

// CLI テスト: node db-api/mecab/index.js "テキスト"
if (require.main === module) {
  (async () => {
    const text = process.argv.slice(2).join(' ') || '寿司が食べたい';
    const mecab = module.exports;
    try {
      const tokens = await mecab.parse(text);
      const normalized = await mecab.normalize(text);
      const reading = await mecab.getReading(text);
      const mora = mecab.countMoraFromKatakana(reading);
      const rhyme = mecab.extractRhymeKeyFromReading(reading);
      console.log('text:', text);
      console.log('tokens:', tokens);
      console.log('normalized:', normalized);
      console.log('reading:', reading);
      console.log('mora (approx):', mora);
      console.log('rhyme key (approx):', rhyme);
    } catch (err) {
      console.error('MeCab parse error:', err.message || err);
      process.exit(1);
    }
  })();
}
