import type { StretchConfig } from "./types";

export function twitterShareUrl(
  config: StretchConfig,
  pageUrl: string,
): string {
  const text = encodeURIComponent(
    `ストレッチを完了しました！ ${config.exercises.length}種類のメニューをこなしました。 #ストレッチタイマー`,
  );
  return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(pageUrl)}`;
}

export function shareOnTwitter(config: StretchConfig): void {
  window.open(twitterShareUrl(config, window.location.href), "_blank");
}
