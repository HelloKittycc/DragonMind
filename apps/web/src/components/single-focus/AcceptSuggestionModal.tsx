"use client";

type Props = {
  isOpen: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function AcceptSuggestionModal({ isOpen, isSaving, onCancel, onConfirm }: Props) {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="sf-modal-overlay accept" role="dialog" aria-modal="true" aria-label="接受建议结果">
      <div className="sf-accept-modal">
        <h2>确认接受这条建议？</h2>
        <strong>结果状态：将把“不要继续使用多页面导航”记入当前判断。</strong>
        <p>确认后，DragonMind 会把这次选择写入当前线索，并保留后续复盘入口。点击取消则不接受建议。</p>
        <div className="sf-modal-actions">
          <button className="sf-button secondary" disabled={isSaving} onClick={onCancel} type="button">
            取消
          </button>
          <button className="sf-button primary" disabled={isSaving} onClick={onConfirm} type="button">
            {isSaving ? "确认中" : "确认接受"}
          </button>
        </div>
      </div>
    </div>
  );
}
