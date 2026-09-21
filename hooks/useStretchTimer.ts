"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/lib/audioPlayer";
import {
  applyTick,
  createInitialState,
  pause as pauseSession,
  skip as skipSession,
  start as startSession,
  TICK_INTERVAL_MS,
  type SessionStep,
} from "@/lib/session";
import type { StretchConfig, TimerState } from "@/lib/types";

export interface StretchTimerApi {
  state: TimerState;
  toggle: () => void;
  skip: () => void;
}

function playBeeps(player: AudioPlayer | null, step: SessionStep): void {
  if (!player) return;
  for (const beep of step.beeps) {
    player.playBeep(beep.frequency, beep.duration);
  }
}

export function useStretchTimer(config: StretchConfig): StretchTimerApi {
  const [state, setState] = useState<TimerState>(() =>
    createInitialState(config),
  );

  const audioRef = useRef<AudioPlayer | null>(null);
  if (audioRef.current === null) {
    audioRef.current = new AudioPlayer();
  }

  const engineRef = useRef<TimerState>(state);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const commit = useCallback(
    (step: SessionStep) => {
      engineRef.current = step.state;
      playBeeps(audioRef.current, step);
      if (step.clock === "reset") {
        lastTickRef.current = Date.now();
      }
      if (step.state.timerStatus !== "running") {
        clearTimer();
      }
      setState(step.state);
    },
    [clearTimer],
  );

  const tick = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;
    commit(applyTick(engineRef.current, config, deltaTime));
  }, [commit, config]);

  const start = useCallback(() => {
    commit(startSession(engineRef.current));
    clearTimer();
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
  }, [clearTimer, commit, tick]);

  const pause = useCallback(() => {
    commit(pauseSession(engineRef.current));
  }, [commit]);

  const toggle = useCallback(() => {
    audioRef.current?.init();
    if (engineRef.current.timerStatus === "running") {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  const skip = useCallback(() => {
    commit(skipSession(engineRef.current, config));
  }, [commit, config]);

  useEffect(() => clearTimer, [clearTimer]);

  return { state, toggle, skip };
}
