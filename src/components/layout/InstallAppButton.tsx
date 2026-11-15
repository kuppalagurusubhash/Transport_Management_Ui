import React, { useEffect, useState } from 'react';
import { DownloadIcon, SmartphoneIcon, ShareIcon, PlusSquareIcon, CheckCircle2Icon, XIcon, MonitorIcon } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

interface InstallAppButtonProps {
  variant?: 'header' | 'sidebar' | 'auth';
}

export function InstallAppButton({ variant = 'header' }: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== 'undefined' && window.__deferredPwaPrompt ? window.__deferredPwaPrompt : null)
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standaloneMatch || iosStandalone);
    };

    checkStandalone();

    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleCustomPwaAvailable = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleCustomPwaAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleCustomPwaAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
        }
        return;
      } catch {
        // Fallback to modal guide if prompt fails
      }
    }
    setShowModal(true);
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#F5B82E]/40 bg-gradient-to-r from-[#F5B82E]/20 via-[#F5B82E]/10 to-amber-500/15 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-extrabold text-[#F5B82E] shadow-[0_0_16px_rgba(245,184,46,0.18)] hover:border-[#F5B82E] hover:bg-[#F5B82E]/25 active:scale-95 transition-all cursor-pointer shrink-0"
          title="Install Web Application"
        >
          <DownloadIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-bounce" />
          <span className="hidden xs:inline sm:inline">Install App</span>
          <span className="xs:hidden sm:hidden">App</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex w-full items-center justify-between gap-2.5 rounded-xl border border-[#F5B82E]/35 bg-gradient-to-r from-[#F5B82E]/15 via-[#F5B82E]/10 to-transparent px-3 py-2.5 text-xs font-bold text-[#F5B82E] shadow-[0_4px_20px_rgba(245,184,46,0.12)] hover:border-[#F5B82E]/70 hover:bg-[#F5B82E]/20 transition-all cursor-pointer mb-2"
        >
          <div className="flex items-center gap-2.5">
            <img
              src="/app-logo.jpg"
              alt="App Logo"
              className="h-7 w-7 rounded-lg object-cover border border-[#F5B82E]/40 shadow-sm"
            />
            <div className="text-left leading-tight">
              <span className="block text-xs font-extrabold text-white">Install App</span>
              <span className="block text-[9.5px] font-medium text-[#F5B82E]/85">
                iPhone, Android &amp; Desktop
              </span>
            </div>
          </div>
          <DownloadIcon className="h-4 w-4 text-[#F5B82E] shrink-0" />
        </button>
      )}

      {variant === 'auth' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-2 rounded-full border border-[#F5B82E]/40 bg-black/60 backdrop-blur-xl px-3.5 py-1.5 text-xs font-bold text-[#F5B82E] shadow-lg hover:border-[#F5B82E] hover:bg-[#F5B82E]/15 transition-all cursor-pointer"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          <span>Install App</span>
        </button>
      )}

      {/* Luxury Install App Modal for iOS Safari / Manual Install Fallback */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#F5B82E]/30 bg-gradient-to-b from-[#0E141C] to-[#070A0F] p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9)] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
            </button>

            {/* Brand Header with App Logo */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
              <img
                src="/app-logo.jpg"
                alt="Trans IA App Logo"
                className="h-16 w-16 rounded-2xl object-cover border-2 border-[#F5B82E]/50 shadow-[0_0_25px_rgba(245,184,46,0.3)] shrink-0"
              />
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#F5B82E]/15 border border-[#F5B82E]/30 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#F5B82E]">
                  Web Application
                </span>
                <h3 className="mt-1 text-base sm:text-lg font-black tracking-tight text-white">
                  Install Sri Sai Baba App
                </h3>
                <p className="text-xs text-neutral-400">
                  Launch directly from your Home Screen with full-screen speed
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F5B82E] to-amber-500 py-3 text-xs sm:text-sm font-black text-black shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <DownloadIcon className="h-4 w-4" />
                  <span>Install Application Now</span>
                </button>
              )}

              {/* iPhone / iOS Instructions */}
              <div
                className={`rounded-xl border p-3.5 space-y-2.5 ${
                  isIOS
                    ? 'border-[#F5B82E]/40 bg-[#F5B82E]/[0.06]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F5B82E]">
                    <SmartphoneIcon className="h-4 w-4" />
                    <span>iPhone &amp; iPad (Safari)</span>
                  </div>
                  {isIOS && (
                    <span className="rounded-full bg-[#F5B82E]/20 px-2 py-0.5 text-[9px] font-bold text-[#F5B82E]">
                      Recommended for Your Device
                    </span>
                  )}
                </div>
                <ol className="space-y-2 text-xs text-neutral-300">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5B82E]/20 text-[10px] font-black text-[#F5B82E]">
                      1
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Tap the <strong>Share</strong> button
                      <span className="inline-flex items-center rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white">
                        <ShareIcon className="h-3 w-3 mr-1 text-[#F5B82E]" /> Share
                      </span>
                      in Safari&apos;s bottom bar
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5B82E]/20 text-[10px] font-black text-[#F5B82E]">
                      2
                    </span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Scroll down and tap
                      <span className="inline-flex items-center rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white">
                        <PlusSquareIcon className="h-3 w-3 mr-1 text-[#F5B82E]" /> Add to Home Screen
                      </span>
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5B82E]/20 text-[10px] font-black text-[#F5B82E]">
                      3
                    </span>
                    <span>
                      Tap <strong className="text-[#F5B82E]">Add</strong> in the top-right corner
                    </span>
                  </li>
                </ol>
              </div>

              {/* Android & Desktop Chrome/Edge Instructions */}
              <div
                className={`rounded-xl border p-3.5 space-y-2 ${
                  !isIOS
                    ? 'border-[#F5B82E]/40 bg-[#F5B82E]/[0.06]'
                    : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <MonitorIcon className="h-4 w-4" />
                  <span>Android &amp; Desktop (Chrome / Edge)</span>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Tap the <strong>⋮ Menu</strong> (on Android) or the <strong>Install icon</strong> in the top address bar (on Desktop) and select{' '}
                  <strong className="text-white">&ldquo;Install App&rdquo;</strong> or{' '}
                  <strong className="text-white">&ldquo;Add to Home screen&rdquo;</strong>.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2Icon className="h-3.5 w-3.5" />
                <span>Works full-screen like a native app</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/15 cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

