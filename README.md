# ObjectT-Hackathon


## 📝 概要

本プロジェクトは、[日本語の形態素解析を利用した、ラップ生成とバトルシミュレーションを行うWebアプリケーションです。]

---

## 🛠️ 使用技術スタック

本プロジェクトは以下の主要な技術を用いて構築されています。

| 領域 | 採用技術 | 主な役割 |
| :--- | :--- | :--- |
| フロントエンド | **Vue.js (Vite)** | ユーザーインターフェース、ラップ作成エディタ |
| バックエンド | **Node.js + Express** | API構築、CPUラップ生成、バトルロジック実行 |
| データベース | **SQLite (初期段階)** | 単語DBの格納、韻・品詞・音節情報などの提供 |
| データ処理 | **MeCab** | 単語DBの初期データ構築、及び実行時の韻分析 |

---

## ⚙️ 開発環境のセットアップ

プロジェクトをローカルで実行するために必要な環境構築手順です。

### 前提条件

以下のソフトウェアが事前にインストールされている必要があります。

* **Node.js (LTS推奨)** および **npm**
* **MeCab** 本体（形態素解析エンジン）
* **Git**

### 1. 共通環境のセットアップ

#### 1-1. Node.js環境の確認

Node.jsおよびnpmがインストールされていることを確認してください。

```bash
node -v
npm -v
```

#### 1-2. MeCab本体のインストール

* macOS(Homebrew):```brew install mecab mecab-ipadic```
* Windows:公式サイトからインストーラーをダウンロード

### 2. リポジトリのクローン

```
git clone https://github.com/ryosaburo/ObjectT-Hackathon.git
cd ObjectT-Hackathon
```
### 3. バックエンドのセットアップ (Node.js/Express, SQLite, MeCabラッパー)

```
cd db-api
npm install
```

### 4. フロントエンドのセットアップ (Vue.js/Vite)

```
cd ../src # 親ディレクトリに戻り、フロントエンドへ移動
npm install
```

---

## ▶️ 実行方法

```
npm run dev
```

## 単語データ追加手順（簡易）

対象ファイル:
- backend/db-api/database/word_to_import.tsv
- DB: backend/db-api/database/word.db
- インポートスクリプト: backend/db-api/database/import_words.js

必須ルール
- ファイルは UTF-8（BOMなし）、区切りはタブ。
- 1行目ヘッダ（必須）:
  `text<TAB>normalized<TAB>reading<TAB>meaning<TAB>pos<TAB>syllables<TAB>rhyme_key<TAB>complexity<TAB>popularity<TAB>tags`
- tags はカンマ区切り（例: flow,slang）。数値列は空欄可。

簡単な作業手順
1. DBバックアップ（必ず実行）
   ```bash
   cd backend/db-api/database
   cp word.db word.db.bak
   ```

2. データ編集
   - `word_to_import.tsv` にヘッダを残して行を追加する（タブ区切り）。
   - 例行（1行）:
     ```
     ラップ	ラップ	ラップ	即興の歌	noun	1	ap	1	0	flow,slang
     ```

3. テストインポート（まず10件程度で）
   ```bash
   head -n 11 backend/db-api/database/word_to_import.tsv > test_import.tsv
   cd backend/db-api/database
   node import_words.js ../database/test_import.tsv
   ```

4. 本番インポート（問題なければ）
   ```bash
   cd backend/db-api/database
   node import_words.js word_to_import.tsv
   ```

5. 結果確認 / ロールバック
   ```bash
   sqlite3 word.db "SELECT COUNT(*) FROM words;"
   sqlite3 word.db "SELECT id,text,reading,tags FROM words ORDER BY id DESC LIMIT 20;"
   # 問題あれば
   cp word.db.bak word.db
   ```

Git ワークフロー（推奨）
```bash
git switch -c add-words/<your-name>
git add backend/db-api/database/word_to_import.tsv
git commit -m "Add words"
git push -u origin add-words/<your-name>
# プルリク作成してレビュー依頼
```

注意
- タブで区切ること（スペースは不可）。  
- 読み等を入れられる場合は入れるとインポートが速く正確です。  
- 大量追加する場合はファイルを分割して順次インポートしてください。





