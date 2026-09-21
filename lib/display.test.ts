import assert from "node:assert/strict";
import { test } from "node:test";
import { CONFIG } from "./config";
import { UI_STATE } from "./constants";
import {
  resolveControls,
  resolveStateClass,
  resolveStatusText,
  resolveTimerText,
} from "./display";
import type { TimerState } from "./types";

function state(partial: Partial<TimerState> = {}): TimerState {
  return {
    timerStatus: "idle",
    timeLeft: 30,
    isWorking: true,
    currentSet: 0,
    finished: false,
    ...partial,
  };
}

test("resolveTimerText shows one decimal while running", () => {
  assert.equal(resolveTimerText(state({ timeLeft: 30 })), "30.0");
  assert.equal(resolveTimerText(state({ timeLeft: 7 })), "7.0");
  assert.equal(resolveTimerText(state({ timeLeft: 3.14 })), "3.1");
  assert.equal(resolveTimerText(state({ timeLeft: 0 })), "0.0");
});

test("resolveTimerText shows FINISH after the session ends", () => {
  assert.equal(
    resolveTimerText(state({ finished: true, timeLeft: 12.3 })),
    "FINISH",
  );
});

test("resolveStatusText prefers finished, then idle, then phase", () => {
  assert.equal(
    resolveStatusText(state({ finished: true, timerStatus: "idle" }), CONFIG),
    "完了！お疲れ様でした",
  );
  assert.equal(resolveStatusText(state(), CONFIG), "準備完了です");
  assert.equal(
    resolveStatusText(state({ timerStatus: "running" }), CONFIG),
    "ワーク中 (1/18)",
  );
  assert.equal(
    resolveStatusText(
      state({ timerStatus: "running", currentSet: 17 }),
      CONFIG,
    ),
    "ワーク中 (18/18)",
  );
  assert.equal(
    resolveStatusText(
      state({ timerStatus: "paused", currentSet: 4 }),
      CONFIG,
    ),
    "ワーク中 (5/18)",
  );
});

test("resolveStatusText rest line uses the next exercise first word", () => {
  assert.equal(
    resolveStatusText(
      state({
        timerStatus: "running",
        isWorking: false,
        currentSet: 0,
      }),
      CONFIG,
    ),
    "休憩中 (次は: 尻足反対)",
  );
  assert.equal(
    resolveStatusText(
      state({
        timerStatus: "running",
        isWorking: false,
        currentSet: 9,
      }),
      CONFIG,
    ),
    "休憩中 (次は: 脚真横)",
  );
  assert.equal(
    resolveStatusText(
      state({
        timerStatus: "running",
        isWorking: false,
        currentSet: 17,
      }),
      CONFIG,
    ),
    "休憩中 (次は: 終了)",
  );
});

test("resolveControls maps idle, run, pause, and finished to button chrome", () => {
  assert.deepEqual(resolveControls(state()), {
    toggleLabel: "スタート",
    isPaused: false,
    showSkip: false,
    showShare: false,
  });
  assert.deepEqual(resolveControls(state({ timerStatus: "running" })), {
    toggleLabel: "一時停止",
    isPaused: false,
    showSkip: true,
    showShare: false,
  });
  assert.deepEqual(resolveControls(state({ timerStatus: "paused" })), {
    toggleLabel: "再開",
    isPaused: true,
    showSkip: true,
    showShare: false,
  });
  assert.deepEqual(
    resolveControls(state({ finished: true, timerStatus: "idle" })),
    {
      toggleLabel: "最初から",
      isPaused: false,
      showSkip: false,
      showShare: true,
    },
  );
});

test("resolveStateClass treats idle, pause, and finished as stopped", () => {
  assert.equal(resolveStateClass(state()), UI_STATE.STOPPED);
  assert.equal(
    resolveStateClass(state({ timerStatus: "paused" })),
    UI_STATE.STOPPED,
  );
  assert.equal(
    resolveStateClass(state({ finished: true, timerStatus: "running" })),
    UI_STATE.STOPPED,
  );
  assert.equal(
    resolveStateClass(state({ timerStatus: "running", isWorking: true })),
    UI_STATE.WORK,
  );
  assert.equal(
    resolveStateClass(state({ timerStatus: "running", isWorking: false })),
    UI_STATE.REST,
  );
});
