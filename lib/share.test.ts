import assert from "node:assert/strict";
import { test } from "node:test";
import { CONFIG } from "./config";
import { twitterShareUrl } from "./share";

test("twitterShareUrl encodes the completion text and page url", () => {
  assert.equal(
    twitterShareUrl(CONFIG, "https://example.com/stretch"),
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      "ストレッチを完了しました！ 18種類のメニューをこなしました。 #ストレッチタイマー",
    )}&url=${encodeURIComponent("https://example.com/stretch")}`,
  );
});
