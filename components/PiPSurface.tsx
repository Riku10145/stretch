interface PiPSurfaceProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function PiPSurface({ canvasRef, videoRef }: PiPSurfaceProps) {
  return (
    <div className="pip-resources hidden">
      <canvas ref={canvasRef} width={400} height={400} />
      <video ref={videoRef} autoPlay muted playsInline />
    </div>
  );
}
