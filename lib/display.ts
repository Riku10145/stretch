import { UI_STATE, type UiStateClass } from "./constants";
import type { StretchConfig, TimerState } from "./types";

export interface TimerControlsView {
  toggleLabel: string;
  isPaused: boolean;
  showSkip: boolean;
  showShare: boolean;
}

export function resolveTimerText(state: TimerState): string {
  return state.finished ? "FINISH" : state.timeLeft.toFixed(1);
}

export function resolveStatusText(
  state: TimerState,
  config: StretchConfig,
): string {
  if (state.finished) return "完了！お疲れ様でした";
  if (state.timerStatus === "idle") return "準備完了です";

  if (state.isWorking) {
    return `ワーク中 (${state.currentSet + 1}/${config.exercises.length})`;
  }

  const nextEx =
    config.exercises[state.currentSet + 1]?.split(" ")[0] ?? "終了";
  return `休憩中 (次は: ${nextEx})`;
}

export function resolveStateClass(state: TimerState): UiStateClass {
  if (
    state.finished ||
    state.timerStatus === "idle" ||
    state.timerStatus === "paused"
  ) {
    return UI_STATE.STOPPED;
  }
  return state.isWorking ? UI_STATE.WORK : UI_STATE.REST;
}

export function resolveControls(state: TimerState): TimerControlsView {
  const isRunning = state.timerStatus === "running";
  const isPaused = state.timerStatus === "paused";
  const toggleLabel = state.finished
    ? "最初から"
    : isRunning
      ? "一時停止"
      : isPaused
        ? "再開"
        : "スタート";

  return {
    toggleLabel,
    isPaused,
    showSkip: isRunning || isPaused,
    showShare: state.finished,
  };
}
