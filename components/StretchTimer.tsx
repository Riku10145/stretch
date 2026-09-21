"use client";

import { useEffect } from "react";
import { Controls } from "@/components/Controls";
import { ExerciseList } from "@/components/ExerciseList";
import { PiPSurface } from "@/components/PiPSurface";
import { TimerDisplay } from "@/components/TimerDisplay";
import { usePictureInPicture } from "@/hooks/usePictureInPicture";
import { useStretchTimer } from "@/hooks/useStretchTimer";
import { CONFIG } from "@/lib/config";
import {
  resolveControls,
  resolveStateClass,
  resolveStatusText,
  resolveTimerText,
} from "@/lib/display";
import { shareOnTwitter } from "@/lib/share";

export function StretchTimer() {
  const { state, toggle, skip } = useStretchTimer(CONFIG);
  const pip = usePictureInPicture(CONFIG);

  useEffect(() => {
    pip.draw(state);
  }, [state, pip]);

  const statusText = resolveStatusText(state, CONFIG);
  const timerText = resolveTimerText(state);
  const stateClass = resolveStateClass(state);
  const controls = resolveControls(state);
  const pipLabel = pip.isActive ? "PiPを終了" : "PiPで表示";

  return (
    <>
      <main className={`container ${stateClass}`}>
        <TimerDisplay statusText={statusText} timerText={timerText} />
        <Controls
          toggleLabel={controls.toggleLabel}
          isPaused={controls.isPaused}
          showSkip={controls.showSkip}
          showShare={controls.showShare}
          pipLabel={pipLabel}
          onToggle={toggle}
          onSkip={skip}
          onShare={() => shareOnTwitter(CONFIG)}
          onTogglePip={pip.toggle}
        />
        <ExerciseList
          exercises={CONFIG.exercises}
          currentSet={state.currentSet}
        />
      </main>

      <PiPSurface canvasRef={pip.canvasRef} videoRef={pip.videoRef} />
    </>
  );
}
