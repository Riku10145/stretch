import { AUDIO } from "./constants";
import type { StretchConfig, TimerState } from "./types";

export const TICK_INTERVAL_MS = 100;

export interface Beep {
  frequency: number;
  duration: number;
}

export type ClockIntent = "keep" | "reset";

export interface SessionStep {
  state: TimerState;
  beeps: Beep[];
  clock: ClockIntent;
}

export function createInitialState(config: StretchConfig): TimerState {
  return {
    timerStatus: "idle",
    timeLeft: config.workTime,
    isWorking: true,
    currentSet: 0,
    finished: false,
  };
}

export function start(state: TimerState): SessionStep {
  const beeps: Beep[] =
    state.timerStatus === "idle"
      ? [{ frequency: AUDIO.FREQ_START, duration: 0.2 }]
      : [];

  return {
    state: {
      ...state,
      finished: state.timerStatus === "idle" ? false : state.finished,
      timerStatus: "running",
    },
    beeps,
    clock: "reset",
  };
}

export function pause(state: TimerState): TimerState {
  return { ...state, timerStatus: "paused" };
}

export function skip(
  state: TimerState,
  config: StretchConfig,
): SessionStep | null {
  if (state.timerStatus === "idle") return null;
  return switchPhase(state, config);
}

export function applyTick(
  state: TimerState,
  config: StretchConfig,
  deltaTime: number,
): SessionStep {
  const prevSeconds = Math.ceil(state.timeLeft);
  const timeLeft = Math.max(0, state.timeLeft - deltaTime);
  const currentSeconds = Math.ceil(timeLeft);
  const beeps: Beep[] = [];

  if (
    state.isWorking &&
    prevSeconds !== currentSeconds &&
    (currentSeconds === 3 || currentSeconds === 2 || currentSeconds === 1)
  ) {
    beeps.push({ frequency: AUDIO.FREQ_COUNTDOWN, duration: 0.05 });
  }

  const ticked = { ...state, timeLeft };
  if (timeLeft > 0) {
    return { state: ticked, beeps, clock: "keep" };
  }

  const phase = switchPhase(ticked, config);
  return {
    state: phase.state,
    beeps: [...beeps, ...phase.beeps],
    clock: phase.clock,
  };
}

function finish(config: StretchConfig): SessionStep {
  return {
    state: {
      currentSet: 0,
      isWorking: true,
      timeLeft: config.workTime,
      timerStatus: "idle",
      finished: true,
    },
    beeps: [{ frequency: AUDIO.FREQ_FINISH, duration: 0.8 }],
    clock: "keep",
  };
}

function switchPhase(state: TimerState, config: StretchConfig): SessionStep {
  const phaseBeep: Beep = { frequency: AUDIO.FREQ_PHASE_CHANGE, duration: 0.5 };

  if (state.isWorking) {
    return {
      state: { ...state, isWorking: false, timeLeft: config.restTime },
      beeps: [phaseBeep],
      clock: "reset",
    };
  }

  const currentSet = state.currentSet + 1;
  if (currentSet >= config.exercises.length) {
    const done = finish(config);
    return {
      state: done.state,
      beeps: [phaseBeep, ...done.beeps],
      clock: "keep",
    };
  }

  return {
    state: {
      ...state,
      currentSet,
      isWorking: true,
      timeLeft: config.workTime,
    },
    beeps: [phaseBeep],
    clock: "reset",
  };
}
