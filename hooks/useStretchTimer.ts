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

  const sync = useCallback(() => {
    setState({ ...engineRef.current });
  }, []);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const applyStep = useCallback(
    (step: SessionStep) => {
      engineRef.current = step.state;
      playBeeps(audioRef.current, step);
      if (step.clock === "reset") {
        lastTickRef.current = Date.now();
      }
      if (step.state.timerStatus !== "running") {
        clearTimer();
      }
    },
    [clearTimer],
  );

  const tick = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;
    applyStep(applyTick(engineRef.current, config, deltaTime));
    sync();
  }, [applyStep, config, sync]);

  const start = useCallback(() => {
    applyStep(startSession(engineRef.current));
    clearTimer();
    intervalRef.current = setInterval(tick, TICK_INTERVAL_MS);
    sync();
  }, [applyStep, clearTimer, sync, tick]);

  const pause = useCallback(() => {
    clearTimer();
    engineRef.current = pauseSession(engineRef.current);
    sync();
  }, [clearTimer, sync]);

  const toggle = useCallback(() => {
    audioRef.current?.init();
    if (engineRef.current.timerStatus === "running") {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  const skip = useCallback(() => {
    const step = skipSession(engineRef.current, config);
    if (step === null) return;
    applyStep(step);
    sync();
  }, [applyStep, config, sync]);

  useEffect(() => clearTimer, [clearTimer]);

  return { state, toggle, skip };
}
