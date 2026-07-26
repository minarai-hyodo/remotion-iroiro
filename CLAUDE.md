# remotion-iroiro

Remotionの技術検証用リポジトリ。検証内容や知見は `docs/` に記録している。

## ディレクトリの位置づけ

- **`react-router/`**（リポジトリルート直下） — ユーザー自身の手元アプリケーション。「Remotionの可能性を探索するために」自由に書き換えていく実験対象。安定したプロダクトではなく、育てながら試すプレイグラウンドとして扱う。現状、`/` がRemotionの `<Player>` を表示するルートページで、それ以外のページはまだ無く、未定義パスは `/` にリダイレクトする構成。
- **`templates/`** — ユーザーが個人的に興味・関心があり理解を深めたい、そして実用性を検証したいRemotion関連テンプレート集（`code-hike`, `prompt-to-motion-graphics`, `prompt-to-video`, `still`, `three` など）。参考実装として置いてあるもので、そのまま動かす／`react-router/`に丸ごと統合する対象ではない。具体的な技術を`react-router/`に移植するのは、ユーザーが指示したとき、または選択肢として提案するときのみ。

## パッケージ管理

`react-router/` は **bun** を使用（`bun.lock`）。npmで依存追加すると`package-lock.json`が紛れ込みSST AutoDeployの`bun install --frozen-lockfile`が壊れるので、依存追加・更新は`bun install`で行うこと。
