import { useEffect, useRef, useState } from "react";

type Detector = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

function createDetector(): Detector | null {
  const ctor = (
    globalThis as unknown as {
      BarcodeDetector?: new (options?: { formats: string[] }) => Detector;
    }
  ).BarcodeDetector;
  if (!ctor) return null;
  return new ctor({
    formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code", "itf"],
  });
}

export function BarcodeScanner({
  active,
  onScan,
}: {
  active: boolean;
  onScan: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    if (!video) return;
    let stream: MediaStream | null = null;
    let timer = 0;
    let cancelled = false;
    const armed = { code: null as string | null, missingSince: null as number | null };

    const stop = () => {
      cancelled = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };

    const loop = async (detector: Detector) => {
      if (cancelled) return;
      try {
        if (video.readyState >= 2) {
          const codes = await detector.detect(video);
          const value = codes[0]?.rawValue?.trim() || null;
          if (!value) {
            if (armed.code && armed.missingSince === null) armed.missingSince = Date.now();
            if (armed.missingSince && Date.now() - armed.missingSince > 700) {
              armed.code = null;
              armed.missingSince = null;
            }
          } else {
            armed.missingSince = null;
            setSeen(value);
            if (value !== armed.code) {
              armed.code = value;
              onScanRef.current(value);
            }
          }
        }
      } catch {
        /* detector can throw on a dropped frame */
      }
      if (!cancelled) timer = window.setTimeout(() => void loop(detector), 280);
    };

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Walang camera sa browser na ito. I-type na lang ang barcode.");
        return;
      }
      const detector = createDetector();
      if (!detector) {
        setError("Hindi suportado ang barcode scan dito. I-type ang code.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setError(null);
        void loop(detector);
      } catch {
        setError("Hindi mabuksan ang camera. Payagan ang camera, o i-type ang barcode.");
      }
    };

    void start();
    return stop;
  }, [active]);

  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-primary-ink">
      <div className="relative">
        <video ref={videoRef} muted playsInline autoPlay className="aspect-video w-full object-cover" />
        <div className="pointer-events-none absolute inset-x-6 top-4 h-px bg-primary scanline" />
      </div>
      <p className="px-3 py-2 text-xs text-on-primary">
        {error ?? (seen ? `Huling scan: ${seen}` : "Itutok ang barcode. Isang beses lang madadagdag habang hawak.")}
      </p>
    </div>
  );
}
