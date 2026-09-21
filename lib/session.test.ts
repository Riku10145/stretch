import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyTick,
  createInitialState,
  pause,
  skip,
  start,
} from "./session";
import type { StretchConfig, TimerState } from "./types";

const config: StretchConfig = {
  workTime: 30,
  restTime: 7,
  exercises: ["one", "two"],
};

function state(partial: Partial<TimerState> = {}): TimerState {
  return { ...createInitialState(config), ...partial };
}

test("createInitialState starts idle on the first work interval", () => {
  assert.deepEqual(createInitialState(config), {
    timerStatus: "idle",
    timeLeft: 30,
    isWorking: true,
    currentSet: 0,
    finished: false,
  });
});

test("start from idle clears finished and plays the start beep", () => {
  const result = start(state({ finished: true }));
  assert.equal(result.state.timerStatus, "running");
  assert.equal(result.state.finished, false);
  assert.equal(result.clock, "reset");
  assert.deepEqual(result.beeps, [{ frequency: 660, duration: 0.2 }]);
});

test("start from pause keeps the phase and plays no beep", () => {
  const paused = state({
    timerStatus: "paused",
    isWorking: false,
    timeLeft: 4.2,
    currentSet: 1,
  });
  const result = start(paused);
  assert.equal(result.state.timerStatus, "running");
  assert.equal(result.state.isWorking, false);
  assert.equal(result.state.timeLeft, 4.2);
  assert.equal(result.state.currentSet, 1);
  assert.deepEqual(result.beeps, []);
});

test("pause only flips timerStatus", () => {
  const running = state({ timerStatus: "running", timeLeft: 12 });
  assert.deepEqual(pause(running), {
    ...running,
    timerStatus: "paused",
  });
});

test("skip from idle is a no-op", () => {
  assert.equal(skip(state(), config), null);
});

test("skip from work enters rest with the phase beep", () => {
  const result = skip(state({ timerStatus: "running", timeLeft: 12.3 }), config);
  assert.ok(result);
  assert.equal(result.state.isWorking, false);
  assert.equal(result.state.timeLeft, 7);
  assert.equal(result.state.timerStatus, "running");
  assert.equal(result.clock, "reset");
  assert.deepEqual(result.beeps, [{ frequency: 880, duration: 0.5 }]);
});

test("skip from rest of the first exercise enters the next work", () => {
  const result = skip(
    state({
      timerStatus: "paused",
      isWorking: false,
      currentSet: 0,
      timeLeft: 3,
    }),
    config,
  );
  assert.ok(result);
  assert.equal(result.state.isWorking, true);
  assert.equal(result.state.currentSet, 1);
  assert.equal(result.state.timeLeft, 30);
  assert.equal(result.state.timerStatus, "paused");
});

test("skip from rest of the last exercise finishes the session", () => {
  const result = skip(
    state({
      timerStatus: "running",
      isWorking: false,
      currentSet: 1,
    }),
    config,
  );
  assert.ok(result);
  assert.deepEqual(result.state, {
    timerStatus: "idle",
    timeLeft: 30,
    isWorking: true,
    currentSet: 0,
    finished: true,
  });
  assert.equal(result.clock, "keep");
  assert.deepEqual(result.beeps, [
    { frequency: 880, duration: 0.5 },
    { frequency: 1000, duration: 0.8 },
  ]);
});

test("applyTick subtracts delta and stays in the same phase", () => {
  const result = applyTick(
    state({ timerStatus: "running", timeLeft: 30 }),
    config,
    1,
  );
  assert.equal(result.state.timeLeft, 29);
  assert.equal(result.state.isWorking, true);
  assert.equal(result.clock, "keep");
  assert.deepEqual(result.beeps, []);
});

test("applyTick beeps only on work when ceil seconds enter 3, 2, or 1", () => {
  const workThree = applyTick(
    state({ timerStatus: "running", timeLeft: 4 }),
    config,
    1,
  );
  assert.equal(workThree.state.timeLeft, 3);
  assert.deepEqual(workThree.beeps, [{ frequency: 440, duration: 0.05 }]);

  const workHold = applyTick(
    state({ timerStatus: "running", timeLeft: 2.5 }),
    config,
    0.2,
  );
  assert.deepEqual(workHold.beeps, []);

  const restThree = applyTick(
    state({
      timerStatus: "running",
      isWorking: false,
      timeLeft: 4,
    }),
    config,
    1,
  );
  assert.deepEqual(restThree.beeps, []);
});

test("applyTick at zero work time switches to rest", () => {
  const result = applyTick(
    state({ timerStatus: "running", timeLeft: 0.04 }),
    config,
    0.1,
  );
  assert.equal(result.state.isWorking, false);
  assert.equal(result.state.timeLeft, 7);
  assert.equal(result.clock, "reset");
  assert.deepEqual(result.beeps, [{ frequency: 880, duration: 0.5 }]);
});

test("applyTick at zero last rest finishes the session", () => {
  const result = applyTick(
    state({
      timerStatus: "running",
      isWorking: false,
      currentSet: 1,
      timeLeft: 0.04,
    }),
    config,
    0.1,
  );
  assert.equal(result.state.finished, true);
  assert.equal(result.state.timerStatus, "idle");
  assert.equal(result.clock, "keep");
  assert.deepEqual(result.beeps, [
    { frequency: 880, duration: 0.5 },
    { frequency: 1000, duration: 0.8 },
  ]);
});

test("a two-exercise session walks work, rest, work, rest, then finish", () => {
  let current = start(createInitialState(config)).state;
  const phases: string[] = [];

  while (!current.finished) {
    const label = current.isWorking
      ? `work-${current.currentSet}`
      : `rest-${current.currentSet}`;
    if (phases.at(-1) !== label) phases.push(label);
    current = applyTick(current, config, 1).state;
  }

  assert.deepEqual(phases, ["work-0", "rest-0", "work-1", "rest-1"]);
  assert.equal(current.timerStatus, "idle");
  assert.equal(current.timeLeft, 30);
  assert.equal(current.currentSet, 0);
  assert.equal(current.isWorking, true);
});
