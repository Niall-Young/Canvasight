import { useEffect, useMemo, useState, type ReactElement } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  defaultAppSettings,
  type AppSettings,
  type LanguagePreference,
  type ThemePreference
} from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { DropdownMenu, DropdownMenuItem } from "./ui/dropdown-menu";
import { IconButton } from "./ui/icon-button";
import { KitButton } from "./ui/kit-button";
import { SelectTrigger } from "./ui/select";
import { Switch } from "./ui/switch";

export type SettingsValues = AppSettings;

interface SettingsDialogProps extends SettingsValues {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPreview: (values: SettingsValues) => void;
  onSave: (values: SettingsValues) => Promise<void>;
  showTranslucentBackground?: boolean;
}

interface SettingsOption<TValue extends string> {
  label: string;
  value: TValue;
}

function SettingsSelect<TValue extends string>({
  ariaLabel,
  onChange,
  options,
  value
}: {
  ariaLabel: string;
  onChange: (value: TValue) => void;
  options: Array<SettingsOption<TValue>>;
  value: TValue;
}): ReactElement {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild>
        <SelectTrigger className="settings-dialog-select" filled label={selected.label} size="sm" aria-label={ariaLabel} />
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content className="settings-dialog-select-popover" sideOffset={6} align="end">
          <DropdownMenu className="settings-dialog-select-menu" role="menu">
            {options.map((option) => (
              <RadixDropdownMenu.Item key={option.value} asChild>
                <DropdownMenuItem
                  label={option.label}
                  selected={option.value === value}
                  role="menuitemradio"
                  aria-checked={option.value === value}
                  onClick={() => onChange(option.value)}
                />
              </RadixDropdownMenu.Item>
            ))}
          </DropdownMenu>
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}

export function SettingsDialog({
  assistantProvider,
  assistantProviderOnboardingCompleted,
  language,
  onOpenChange,
  onPreview,
  onSave,
  open,
  showTranslucentBackground = true,
  themePreference,
  translucentBackground
}: SettingsDialogProps): ReactElement {
  const { t } = useI18n();
  const [draftThemePreference, setDraftThemePreference] = useState(themePreference);
  const [draftLanguage, setDraftLanguage] = useState(language);
  const [draftTranslucentBackground, setDraftTranslucentBackground] = useState(translucentBackground);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const themeOptions: Array<SettingsOption<ThemePreference>> = [
    { label: t("settings.theme.system"), value: "system" },
    { label: t("settings.theme.light"), value: "light" },
    { label: t("settings.theme.dark"), value: "dark" }
  ];
  const languageOptions: Array<SettingsOption<LanguagePreference>> = [
    { label: t("settings.language.zh"), value: "zh" },
    { label: t("settings.language.en"), value: "en" }
  ];

  useEffect(() => {
    setDraftThemePreference(themePreference);
    setDraftLanguage(language);
    setDraftTranslucentBackground(translucentBackground);
    setSaveError(null);
  }, [language, themePreference, translucentBackground]);

  const saveValues = useMemo(
    () => ({
      themePreference: draftThemePreference,
      language: draftLanguage,
      translucentBackground: draftTranslucentBackground,
      assistantProvider,
      assistantProviderOnboardingCompleted
    }),
    [assistantProvider, assistantProviderOnboardingCompleted, draftLanguage, draftThemePreference, draftTranslucentBackground]
  );

  useEffect(() => {
    if (!open) return;
    onPreview(saveValues);
  }, [onPreview, open, saveValues]);

  async function save(): Promise<void> {
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(saveValues);
      onOpenChange(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("settings.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <RadixDialog.Root modal open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="settings-dialog-overlay" />
        <RadixDialog.Content
          className="settings-dialog-content"
          aria-describedby={undefined}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <header className="settings-dialog-header">
            <RadixDialog.Title className="settings-dialog-title">{t("settings.title")}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton className="settings-dialog-close" filled={false} icon="x" size="sm" aria-label={t("settings.close")} />
            </RadixDialog.Close>
          </header>

          <div className="settings-dialog-body">
            <div className="settings-dialog-row">
              <span className="settings-dialog-row-label">{t("settings.theme")}</span>
              <SettingsSelect ariaLabel={t("settings.theme")} options={themeOptions} value={draftThemePreference} onChange={setDraftThemePreference} />
            </div>
            <div className="settings-dialog-row">
              <span className="settings-dialog-row-label">{t("settings.language")}</span>
              <SettingsSelect ariaLabel={t("settings.language")} options={languageOptions} value={draftLanguage} onChange={setDraftLanguage} />
            </div>
            {showTranslucentBackground ? (
              <div className="settings-dialog-row">
                <span className="settings-dialog-row-label">{t("settings.translucentBackground")}</span>
                <Switch checked={draftTranslucentBackground} onCheckedChange={setDraftTranslucentBackground} />
              </div>
            ) : null}
          </div>

          <footer className="settings-dialog-footer">
            {saveError ? <p className="settings-dialog-error">{saveError}</p> : null}
            <div className="settings-dialog-actions">
              <KitButton
                filled={false}
                size="md"
                disabled={isSaving}
                onClick={() => {
                  setDraftThemePreference(defaultAppSettings.themePreference);
                  setDraftLanguage(defaultAppSettings.language);
                  setDraftTranslucentBackground(defaultAppSettings.translucentBackground);
                }}
              >
                {t("settings.restoreDefaults")}
              </KitButton>
              <KitButton
                filled
                size="md"
                disabled={isSaving}
                onClick={() => void save()}
              >
                {isSaving ? t("settings.saving") : t("settings.save")}
              </KitButton>
            </div>
          </footer>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
