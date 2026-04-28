import {
  Alignment,
  Fit,
  Layout,
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceBoolean,
  useViewModelInstanceNumber,
} from "@rive-app/react-webgl2";
import type {
  ButtonHTMLAttributes,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
} from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MIN_VALUE = 0;
const MAX_VALUE = 3;
const CONTROL_COOLDOWN_MS = 350;
const RIVE_SRC = `${import.meta.env.BASE_URL}flower.riv`;

type SpringButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  thresholdDisabled?: boolean;
};

function clampValue(value: number) {
  return Math.min(MAX_VALUE, Math.max(MIN_VALUE, value));
}

function SpringButton({
  label,
  children,
  className = "",
  disabled,
  thresholdDisabled = false,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
  onKeyDown,
  onKeyUp,
  ...props
}: SpringButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const press = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const release = () => {
    setIsPressed(false);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    press();
    onPointerDown?.(event);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    release();
    onPointerUp?.(event);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    release();
    onPointerCancel?.(event);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    release();
    onPointerLeave?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      press();
    }
    onKeyDown?.(event);
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      release();
    }
    onKeyUp?.(event);
  };

  return (
    <button
      aria-label={label}
      className={`spring-button ${isPressed ? "is-pressed" : ""} ${className}`}
      data-threshold-disabled={thresholdDisabled ? "true" : undefined}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      type="button"
      {...props}
    >
      <span className="button-face">{children}</span>
    </button>
  );
}

function LinkPill({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="footer-link"
      href={href}
      aria-label={`${label} profile`}
      target="_blank"
      rel="noreferrer"
    >
      <svg
        aria-hidden="true"
        className="link-caret"
        viewBox="0 0 5 9"
        width="5"
        height="9"
      >
        <path
          d="M4.75617 4.18165L0.693672 0.119148C0.636856 0.0622685 0.56444 0.0235254 0.485593 0.00782367C0.406747 -0.00787805 0.325013 0.000167576 0.250741 0.030942C0.17647 0.0617165 0.112999 0.113836 0.0683637 0.180702C0.0237287 0.247568 -6.31424e-05 0.326175 1.25856e-07 0.40657V8.53157C-6.31424e-05 8.61197 0.0237287 8.69057 0.0683637 8.75744C0.112999 8.8243 0.17647 8.87642 0.250741 8.9072C0.325013 8.93797 0.406747 8.94602 0.485593 8.93032C0.56444 8.91461 0.636856 8.87587 0.693672 8.81899L4.75617 4.75649C4.79394 4.71876 4.82391 4.67396 4.84435 4.62464C4.8648 4.57532 4.87532 4.52246 4.87532 4.46907C4.87532 4.41568 4.8648 4.36282 4.84435 4.3135C4.82391 4.26418 4.79394 4.21938 4.75617 4.18165Z"
          fill="currentColor"
        />
      </svg>
      <span>{label}</span>
    </a>
  );
}

function NumberDisplay({ value }: { value: number }) {
  return (
    <div className="number-display-wrap">
      <output className="number-display" aria-live="polite">
        {value}
      </output>
    </div>
  );
}

function App() {
  const [count, setCountState] = useState(0);
  const [isSad, setIsSad] = useState(false);
  const [controlsLocked, setControlsLocked] = useState(false);
  const cooldownTimerRef = useRef<number | null>(null);

  const layout = useMemo(
    () =>
      new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
    [],
  );

  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    artboard: "flower",
    stateMachines: "Interaction",
    autoplay: true,
    autoBind: false,
    layout,
  });

  const viewModel = useViewModel(rive, { name: "ViewModel1" });
  const viewModelInstance = useViewModelInstance(viewModel, { rive });
  const numberBinding = useViewModelInstanceNumber(
    "numberProperty",
    viewModelInstance,
  );
  const sadBinding = useViewModelInstanceBoolean(
    "sadtrigger",
    viewModelInstance,
  );

  useEffect(() => {
    numberBinding.setValue?.(count);
  }, [count, numberBinding.setValue]);

  useEffect(() => {
    sadBinding.setValue?.(isSad);
  }, [isSad, sadBinding.setValue]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current !== null) {
        window.clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  const startControlsCooldown = useCallback(() => {
    setControlsLocked(true);
    if (cooldownTimerRef.current !== null) {
      window.clearTimeout(cooldownTimerRef.current);
    }
    cooldownTimerRef.current = window.setTimeout(() => {
      setControlsLocked(false);
      cooldownTimerRef.current = null;
    }, CONTROL_COOLDOWN_MS);
  }, []);

  const setCount = useCallback(
    (delta: number) => {
      if (controlsLocked) {
        return;
      }

      const nextCount = clampValue(count + delta);
      if (nextCount === count) {
        return;
      }

      setCountState(nextCount);
      startControlsCooldown();
    },
    [controlsLocked, count, startControlsCooldown],
  );

  const toggleSad = useCallback(() => {
    if (controlsLocked) {
      return;
    }

    setIsSad((currentSad) => !currentSad);
    startControlsCooldown();
  }, [controlsLocked, startControlsCooldown]);

  const isAtMin = count <= MIN_VALUE;
  const isAtMax = count >= MAX_VALUE;

  return (
    <main className="page-shell">
      <section className="centered-card" aria-labelledby="portfolio-title">
        <div className="flower-place">
          <div className="ticker" aria-hidden="true">
            <div className="ticker-track">
              <span>Dani Baianov</span>
              <span>Dani Baianov</span>
              <span>Dani Baianov</span>
              <span>Dani Baianov</span>
            </div>
          </div>

          <div className="rive-stage" aria-label="Interactive flower animation">
            <RiveComponent className="rive-canvas" />
          </div>
          <div className="table-fill" aria-hidden="true" />
        </div>

        <div className="content-panel">
          <div className="controls" aria-label="Flower controls">
            <SpringButton
              label="Decrease flower value"
              className="minus-button"
              disabled={isAtMin || controlsLocked}
              thresholdDisabled={isAtMin}
              onClick={() => setCount(-1)}
            >
              <svg aria-hidden="true" className="minus-icon" viewBox="0 0 15 5">
                <path
                  d="M0 2.3584H14.1498"
                  stroke="#303E00"
                  strokeWidth="4.71661"
                />
              </svg>
            </SpringButton>

            <NumberDisplay value={count} />

            <SpringButton
              label="Increase flower value"
              className="plus-button"
              disabled={isAtMax || controlsLocked}
              thresholdDisabled={isAtMax}
              onClick={() => setCount(1)}
            >
              <svg aria-hidden="true" className="plus-icon" viewBox="0 0 15 15">
                <path d="M0 7.07129H14.1498" stroke="#303E00" strokeWidth="3.53746" />
                <path d="M7.07129 14.1504L7.07129 0.000553131" stroke="#303E00" strokeWidth="3.53746" />
              </svg>
            </SpringButton>

            <SpringButton
              label={isSad ? "Repair heart state" : "Toggle broken heart state"}
              className="heart-button"
              aria-pressed={isSad}
              disabled={controlsLocked}
              onClick={toggleSad}
            >
              <svg aria-hidden="true" className="heart-icon" viewBox="0 0 23 23">
                <path
                  d="M21.5454 9.65861C21.0791 15.7159 12.2286 20.5504 11.8423 20.7579C11.7376 20.8142 11.6206 20.8437 11.5018 20.8437C11.3829 20.8437 11.266 20.8142 11.1613 20.7579C10.7633 20.545 1.4375 15.4535 1.4375 9.16447C1.43725 8.15541 1.7111 7.16523 2.22981 6.29969C2.74851 5.43416 3.49258 4.72577 4.38255 4.25021C5.27252 3.77464 6.27495 3.54975 7.28279 3.59957C8.29062 3.64938 9.26599 3.97202 10.1047 4.53302C10.1492 4.56249 10.1865 4.60149 10.214 4.64718C10.2415 4.69287 10.2585 4.74411 10.2638 4.79718C10.269 4.85025 10.2624 4.90382 10.2443 4.95401C10.2263 5.0042 10.1973 5.04975 10.1595 5.08736L8.95922 6.28947C8.82453 6.42425 8.74887 6.60699 8.74887 6.79753C8.74887 6.98808 8.82453 7.17082 8.95922 7.3056L11.8818 10.2282L9.97266 12.1293C9.9031 12.1954 9.84748 12.2747 9.80908 12.3626C9.77067 12.4505 9.75025 12.5453 9.74902 12.6412C9.74779 12.7371 9.76578 12.8323 9.80193 12.9212C9.83807 13.0101 9.89164 13.0908 9.95948 13.1586C10.0273 13.2265 10.108 13.28 10.1969 13.3162C10.2858 13.3523 10.381 13.3703 10.4769 13.3691C10.5728 13.3679 10.6676 13.3474 10.7555 13.309C10.8434 13.2706 10.9227 13.215 10.9888 13.1454L13.4038 10.7313C13.5385 10.5966 13.6141 10.4138 13.6141 10.2233C13.6141 10.0327 13.5385 9.84999 13.4038 9.71521L10.4848 6.79529L12.0543 5.22572C12.5747 4.70266 13.1944 4.28888 13.877 4.0087C14.5595 3.72851 15.2912 3.58757 16.029 3.59415C19.2921 3.61482 21.7952 6.40537 21.5454 9.65861Z"
                  fill="#303E00"
                />
              </svg>
            </SpringButton>
          </div>

          <h1 id="portfolio-title" className="sr-only">
            Flower interactive portfolio
          </h1>

          <p className="body-copy">
            This is flower CuiCui, say hiii to her, click to the numbers to grow
            her, I used Rive for animations and Codex to integrate into the
            web-site, if you like the work please support me with a like
          </p>

          <nav className="footer-links" aria-label="Portfolio links">
            <LinkPill
              label="LinkedIn"
              href="https://www.linkedin.com/in/daniyar-rive/"
            />
            <LinkPill label="X.com" href="https://x.com/DaniyarUI" />
            <LinkPill
              label="Instagram"
              href="https://www.instagram.com/danivectorbender?igsh=MTd6cWh2bTZ3cXRoMw%3D%3D&utm_source=qr"
            />
            <LinkPill
              label="Youtube"
              href="https://www.youtube.com/@DaniBaianov"
            />
          </nav>
        </div>
      </section>
    </main>
  );
}

export default App;
