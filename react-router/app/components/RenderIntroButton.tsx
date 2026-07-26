import { useRendering } from "../lib/use-rendering";
import { COMPOSITION_ID } from "../remotion/constants.mjs";

const buttonClass =
  "rounded-geist bg-foreground text-background px-geist-half py-geist-quarter text-sm font-medium disabled:bg-button-disabled-color disabled:text-disabled-text-color";

export const RenderIntroButton: React.FC = () => {
  const { renderMedia, state, undo } = useRendering(COMPOSITION_ID, {});

  if (state.status === "init") {
    return (
      <button className={buttonClass} onClick={renderMedia}>
        Render video
      </button>
    );
  }

  if (state.status === "invoking") {
    return (
      <button className={buttonClass} disabled>
        Preparing render…
      </button>
    );
  }

  if (state.status === "rendering") {
    const percentage = Math.round(state.progress * 100);
    return (
      <div className="flex items-center gap-geist-half">
        <div className="h-2 flex-1 overflow-hidden rounded-geist bg-unfocused-border-color">
          <div
            className="h-full rounded-geist bg-foreground transition-[width]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-subtitle">{percentage}%</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-center gap-geist-half">
        <span className="text-sm text-geist-error">Error: {state.error.message}</span>
        <button className={buttonClass} onClick={undo}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-geist-half">
      <a className={buttonClass} href={state.url} download>
        Download video ({(state.size / 1024 / 1024).toFixed(1)} MB)
      </a>
      <button className={buttonClass} onClick={undo}>
        Render again
      </button>
    </div>
  );
};
