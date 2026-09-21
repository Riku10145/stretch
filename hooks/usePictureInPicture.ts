"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveStatusText, resolveTimerText } from "@/lib/display";
import type { StretchConfig, TimerState } from "@/lib/types";

const PIP_FPS = 10;

interface PiPColors {
  bg: string;
  text: string;
}

function resolveColors(isActive: boolean, isWorking: boolean): PiPColors {
  if (!isActive) return { bg: "#f4f4f9", text: "#333333" };
  return isWorking
    ? { bg: "#e74c3c", text: "#ffffff" }
    : { bg: "#2ecc71", text: "#ffffff" };
}

export interface PictureInPictureApi {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  toggle: () => Promise<void>;
  draw: (state: TimerState) => void;
}

export function usePictureInPicture(
  config: StretchConfig,
): PictureInPictureApi {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);

  const draw = useCallback(
    (state: TimerState) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const { width, height } = canvas;
      const timerText = resolveTimerText(state);
      const statusText = resolveStatusText(state, config);
      const isRunning = state.timerStatus === "running" && !state.finished;

      const { bg, text: textColor } = resolveColors(
        isRunning,
        state.isWorking,
      );

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";

      ctx.font = "bold 80px sans-serif";
      ctx.fillText(timerText, width / 2, height / 2 + 20);

      ctx.font = "24px sans-serif";
      ctx.fillText(statusText, width / 2, 60);

      const currentExercise = config.exercises[state.currentSet] ?? "完了";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(currentExercise, width / 2, height - 50);
    },
    [config],
  );

  const toggle = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        const stream = canvas.captureStream(PIP_FPS);
        video.srcObject = stream;
        await video.play();
        await video.requestPictureInPicture();
      }
    } catch (error) {
      console.error("PiPの起動に失敗しました:", error);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnter = () => setIsActive(true);
    const onLeave = () => setIsActive(false);

    video.addEventListener("enterpictureinpicture", onEnter);
    video.addEventListener("leavepictureinpicture", onLeave);

    return () => {
      video.removeEventListener("enterpictureinpicture", onEnter);
      video.removeEventListener("leavepictureinpicture", onLeave);
    };
  }, []);

  return { canvasRef, videoRef, isActive, toggle, draw };
}
