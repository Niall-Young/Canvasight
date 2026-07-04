import { useEffect, useMemo, useState, type ReactElement } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import type { AssistantProvider } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { cn } from "../lib/utils";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { KitButton } from "./ui/kit-button";

interface AssistantProviderPreferenceDialogProps {
  assistantProvider: AssistantProvider;
  open: boolean;
  onDismiss: () => Promise<void>;
  onSave: (provider: AssistantProvider) => Promise<void>;
}

interface AssistantProviderOption {
  descriptionKey: "onboarding.assistantProvider.codexDescription" | "onboarding.assistantProvider.claudeDescription";
  icon: string;
  labelKey: "onboarding.assistantProvider.codex" | "onboarding.assistantProvider.claude";
  value: AssistantProvider;
}

const providerOptions: AssistantProviderOption[] = [
  {
    descriptionKey: "onboarding.assistantProvider.codexDescription",
    icon: "codex-logo",
    labelKey: "onboarding.assistantProvider.codex",
    value: "codex"
  },
  {
    descriptionKey: "onboarding.assistantProvider.claudeDescription",
    icon: "claude-logo",
    labelKey: "onboarding.assistantProvider.claude",
    value: "claude-cli"
  }
];

export function AssistantProviderPreferenceDialog({
  assistantProvider,
  onDismiss,
  onSave,
  open
}: AssistantProviderPreferenceDialogProps): ReactElement {
  const { t } = useI18n();
  const [selectedProvider, setSelectedProvider] = useState<AssistantProvider | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedOption = useMemo(
    () => providerOptions.find((option) => option.value === selectedProvider) ?? null,
    [selectedProvider]
  );

  useEffect(() => {
    if (!open) return;
    setSelectedProvider(assistantProvider);
    setSaveError(null);
    setIsSaving(false);
  }, [assistantProvider, open]);

  async function dismiss(): Promise<void> {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onDismiss();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("onboarding.saveFailed"));
      setIsSaving(false);
    }
  }

  async function save(): Promise<void> {
    if (!selectedProvider || isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(selectedProvider);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t("onboarding.saveFailed"));
      setIsSaving(false);
    }
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) void dismiss();
    }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="assistant-provider-dialog-overlay" />
        <RadixDialog.Content className="assistant-provider-dialog-content" aria-describedby={undefined}>
          <header className="assistant-provider-dialog-header">
            <RadixDialog.Title className="assistant-provider-dialog-title">{t("onboarding.title")}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton
                className="assistant-provider-dialog-close"
                filled={false}
                icon="x"
                size="sm"
                aria-label={t("onboarding.close")}
                disabled={isSaving}
              />
            </RadixDialog.Close>
          </header>

          <div className="assistant-provider-dialog-body">
            <p className="assistant-provider-dialog-prompt">{t("onboarding.prompt")}</p>
            <div className="assistant-provider-card-row" role="radiogroup" aria-label={t("onboarding.prompt")}>
              {providerOptions.map((option) => {
                const isSelected = option.value === selectedProvider;
                return (
                  <button
                    key={option.value}
                    className={cn("assistant-provider-card", isSelected && "is-selected")}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={t("onboarding.selectProvider", { provider: t(option.labelKey) })}
                    disabled={isSaving}
                    onClick={() => setSelectedProvider(option.value)}
                  >
                    <Icon name={option.icon} size={24} />
                    <span className="assistant-provider-card-copy">
                      <span className="assistant-provider-card-title">{t(option.labelKey)}</span>
                      <span className="assistant-provider-card-description">{t(option.descriptionKey)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <footer className="assistant-provider-dialog-footer">
            {saveError ? <p className="assistant-provider-dialog-error">{saveError}</p> : null}
            <KitButton className="assistant-provider-dialog-confirm" filled size="md" disabled={!selectedOption || isSaving} onClick={() => void save()}>
              {isSaving ? t("onboarding.saving") : t("onboarding.confirm")}
            </KitButton>
          </footer>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
