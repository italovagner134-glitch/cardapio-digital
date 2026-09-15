"use client";

/**
 * Upload de vídeo/imagem de capa (UI ainda não construída no painel):
 * bucket `store-media` no Supabase Storage, caminho {restaurant_id}/cover.*.
 * Validação a aplicar quando a tela de upload existir: MP4 (H.264/AAC) ou
 * WebM, no máximo 10 MB e 12 segundos, resolução recomendada 1080×1350.
 * Gerar o poster automaticamente a partir do primeiro frame no momento do
 * upload. As policies de RLS do bucket já existem (phase2d_store_media_bucket).
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

interface StoreCoverProps {
  storeName: string;
  logoUrl: string | null;
  coverType: string;
  coverUrl: string | null;
  coverVideoUrl: string | null;
  coverPosterUrl: string | null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDataSaverOn(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (!connection) return false;
  return connection.saveData === true || connection.effectiveType === "slow-2g" || connection.effectiveType === "2g";
}

/** true = pode tocar vídeo (nem reduced-motion nem data-saver ativos). É um
 * valor de fora do React (media query + Network Information API), então
 * usamos useSyncExternalStore em vez de useEffect+setState — dá o mesmo
 * resultado sem o "cascading render" do setState síncrono dentro de efeito,
 * e de brinde reage se a pessoa mudar a preferência com a página aberta. */
function subscribeToMotionPreference(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);

  const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
  connection?.addEventListener("change", callback);

  return () => {
    media.removeEventListener("change", callback);
    connection?.removeEventListener("change", callback);
  };
}

function getMotionAllowedSnapshot(): boolean {
  return !prefersReducedMotion() && !isDataSaverOn();
}

function getMotionAllowedServerSnapshot(): boolean {
  // No servidor não dá pra saber a preferência de quem vai abrir a página —
  // assume o lado seguro (sem vídeo) pra bater com a 1ª pintura do cliente,
  // que corrige pra cima assim que o hook lê o valor real do navegador.
  return false;
}

export function StoreCover({
  storeName,
  logoUrl,
  coverType,
  coverUrl,
  coverVideoUrl,
  coverPosterUrl,
}: StoreCoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const motionAllowed = useSyncExternalStore(
    subscribeToMotionPreference,
    getMotionAllowedSnapshot,
    getMotionAllowedServerSnapshot,
  );

  const posterSrc = coverPosterUrl ?? coverUrl;
  const canTryVideo = coverType === "video" && !!coverVideoUrl && !videoFailed && motionAllowed;

  // Pausa quando a aba não está visível ou a capa sai da viewport — economiza
  // bateria e evita competir com o scroll.
  useEffect(() => {
    if (!canTryVideo) return;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    function onVisibilityChange() {
      if (document.hidden) video?.pause();
      else video?.play().catch(() => {});
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video?.play().catch(() => {});
        else video?.pause();
      },
      { threshold: 0.1 },
    );

    document.addEventListener("visibilitychange", onVisibilityChange);
    observer.observe(container);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer.disconnect();
    };
  }, [canTryVideo]);

  return (
    <div ref={containerRef} className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
      {canTryVideo ? (
        <video
          ref={videoRef}
          src={coverVideoUrl ?? undefined}
          poster={posterSrc ?? undefined}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          controls={false}
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
          className="pointer-events-none size-full object-cover"
        />
      ) : posterSrc && !posterFailed ? (
        <Image
          src={posterSrc}
          alt=""
          fill
          priority
          sizes="480px"
          className="object-cover"
          onError={() => setPosterFailed(true)}
        />
      ) : (
        <div className="relative flex size-full items-center justify-center bg-gradient-to-b from-surface to-bg">
          {logoUrl && (
            <Image
              src={logoUrl}
              alt=""
              fill
              className="scale-150 object-contain opacity-[0.06]"
              aria-hidden="true"
            />
          )}
        </div>
      )}

      {/* Fusão com o fundo da página — a mídia "derrete" no --bg. */}
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to top, var(--bg) 0%, transparent 100%)" }}
        aria-hidden="true"
      />

      <span className="sr-only">Capa de {storeName}</span>
    </div>
  );
}
