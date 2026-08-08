import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ReactElement } from "react";
import type { ConnectedNodeKind, ConnectedNodeMenuRequest } from "../application/CanvasActionsContext";
import { useI18n } from "../lib/i18n";
import { ActionMenuItem } from "./ui/action-menu-item";

interface ConnectedNodeMenuProps {
  request: ConnectedNodeMenuRequest;
  onClose: () => void;
  onSelect: (kind: ConnectedNodeKind) => void;
}

export function ConnectedNodeMenu({ request, onClose, onSelect }: ConnectedNodeMenuProps): ReactElement {
  const { t } = useI18n();
  return (
    <RadixDropdownMenu.Root key={request.id} open onOpenChange={(open) => { if (!open) onClose(); }}>
      <RadixDropdownMenu.Trigger asChild>
        <button
          className="connected-node-menu-anchor"
          type="button"
          tabIndex={-1}
          aria-label={t("nodeCreation.menu")}
          style={{ left: request.anchor.clientX, top: request.anchor.clientY }}
        />
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          className="dropdown-content node-action-menu connected-node-menu"
          side={request.dropPosition ? "right" : request.side}
          align="center"
          sideOffset={8}
          collisionPadding={12}
          aria-label={t("nodeCreation.menu")}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            request.anchor.focusTarget?.focus();
          }}
        >
          <RadixDropdownMenu.Item asChild onSelect={() => onSelect("task")}>
            <ActionMenuItem icon="tasks" label={t("nodeCreation.task")} />
          </RadixDropdownMenu.Item>
          <RadixDropdownMenu.Item asChild onSelect={() => onSelect("file")}>
            <ActionMenuItem icon="upload-documents" label={t("nodeCreation.file")} />
          </RadixDropdownMenu.Item>
          <RadixDropdownMenu.Item asChild onSelect={() => onSelect("media")}>
            <ActionMenuItem icon="image-square" label={t("nodeCreation.media")} />
          </RadixDropdownMenu.Item>
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}
