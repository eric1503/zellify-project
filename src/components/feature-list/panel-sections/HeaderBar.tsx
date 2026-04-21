import { ListChecks, Trash2 } from "lucide-react";

interface HeaderBarProps {
  onDelete?: () => void;
}

export function HeaderBar({ onDelete }: HeaderBarProps) {
  return (
    <div className="flex items-center justify-between h-[30px] px-4 shrink-0">
      <div className="flex items-center gap-2">
        <ListChecks size={16} className="text-[var(--icon-foreground)] shrink-0" />
        <span className="label-text-sm text-[var(--text-foreground)]">
          Feature List
        </span>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="w-6 h-6 flex items-center justify-center cursor-pointer shrink-0
          bg-transparent border-none rounded-[var(--radius-md)]
          text-[var(--icon-muted-foreground)] hover:text-[var(--icon-foreground)] transition-colors"
        aria-label="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
