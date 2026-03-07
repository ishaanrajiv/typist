import type { AppMode, AppSettings, CodeLanguage } from "../types";

const MODE_LABEL: Record<AppMode, string> = {
  classic: "Classic",
  coder: "Coder",
  learn: "Learn",
};

const CODE_LANGUAGES: CodeLanguage[] = ["javascript", "python", "c"];

type ControlBarProps = {
  settings: AppSettings;
  showSettings: boolean;
  onModeChange: (mode: AppMode) => void;
  onSettingsPatch: (patch: Partial<AppSettings>) => void;
  onToggleSettings: () => void;
};

export const ControlBar = ({
  settings,
  showSettings,
  onModeChange,
  onSettingsPatch,
  onToggleSettings,
}: ControlBarProps) => {
  return (
    <header className="control-bar">
      <div className="mode-switch" role="tablist" aria-label="Typing mode">
        {(Object.keys(MODE_LABEL) as AppMode[]).map((mode) => (
          <button
            key={mode}
            className={`mode-chip ${settings.mode === mode ? "is-active" : ""}`}
            onClick={() => onModeChange(mode)}
            type="button"
            role="tab"
            aria-selected={settings.mode === mode}
          >
            {MODE_LABEL[mode]}
          </button>
        ))}
      </div>

      <div className="control-row">
        {settings.mode === "classic" && (
          <>
            <label className="control-group">
              <span>Duration</span>
              <select
                value={settings.classicDuration}
                onChange={(event) =>
                  onSettingsPatch({
                    classicDuration: Number(event.target.value) as AppSettings["classicDuration"],
                  })
                }
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={120}>120s</option>
              </select>
            </label>
            <label className="toggle-group">
              <input
                type="checkbox"
                checked={settings.punctuation}
                onChange={(event) =>
                  onSettingsPatch({
                    punctuation: event.target.checked,
                  })
                }
              />
              punctuation
            </label>
            <label className="toggle-group">
              <input
                type="checkbox"
                checked={settings.numbers}
                onChange={(event) =>
                  onSettingsPatch({
                    numbers: event.target.checked,
                  })
                }
              />
              numbers
            </label>
          </>
        )}

        {settings.mode === "coder" && (
          <>
            <label className="control-group">
              <span>Language</span>
              <select
                value={settings.language}
                onChange={(event) =>
                  onSettingsPatch({
                    language: event.target.value as CodeLanguage,
                  })
                }
              >
                {CODE_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </select>
            </label>
            <label className="control-group">
              <span>Duration</span>
              <select
                value={settings.coderDuration}
                onChange={(event) =>
                  onSettingsPatch({
                    coderDuration: Number(event.target.value) as AppSettings["coderDuration"],
                  })
                }
              >
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={90}>90s</option>
              </select>
            </label>
          </>
        )}

        {settings.mode === "learn" && (
          <p className="control-copy">
            Untimed practice. Submit when done to receive a habit report.
          </p>
        )}

        <button
          className={`settings-button ${showSettings ? "is-active" : ""}`}
          onClick={onToggleSettings}
          type="button"
        >
          settings
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <label className="control-group">
            <span>Font</span>
            <input
              min={0.9}
              max={1.25}
              step={0.05}
              type="range"
              value={settings.fontScale}
              onChange={(event) =>
                onSettingsPatch({
                  fontScale: Number(event.target.value),
                })
              }
            />
          </label>
          <label className="toggle-group">
            <input
              type="checkbox"
              checked={settings.sound}
              onChange={(event) =>
                onSettingsPatch({
                  sound: event.target.checked,
                })
              }
            />
            key sound
          </label>
        </div>
      )}
    </header>
  );
};
