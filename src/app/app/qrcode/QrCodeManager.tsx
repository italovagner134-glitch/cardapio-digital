"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrCodeManagerProps {
  slug: string;
}

export function QrCodeManager({ slug }: QrCodeManagerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // window só existe no cliente — useSyncExternalStore evita mismatch de
  // hidratação (servidor não tem window.location; renderiza null até o
  // cliente assumir), sem precisar de setState num efeito.
  const url = useSyncExternalStore(
    () => () => {},
    () => `${window.location.origin}/${slug}`,
    () => null,
  );

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 240, margin: 1 });
  }, [url]);

  if (!url) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(url ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadPng() {
    const dataUrl = await QRCode.toDataURL(url ?? "", { width: 1024, margin: 1 });
    triggerDownload(dataUrl, `cardapio-${slug}.png`);
  }

  async function handleDownloadSvg() {
    const svg = await QRCode.toString(url ?? "", { type: "svg", margin: 1 });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const blobUrl = URL.createObjectURL(blob);
    triggerDownload(blobUrl, `cardapio-${slug}.svg`);
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
      <canvas ref={canvasRef} className="rounded-lg border border-border" />

      <p className="break-all text-center font-mono text-sm text-muted-foreground">{url}</p>

      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        <Button type="button" variant="outline" onClick={handleDownloadPng}>
          <Download className="size-4" /> PNG
        </Button>
        <Button type="button" variant="outline" onClick={handleDownloadSvg}>
          <Download className="size-4" /> SVG
        </Button>
      </div>
    </div>
  );
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
