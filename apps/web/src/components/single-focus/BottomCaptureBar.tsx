"use client";

import { useState } from "react";
import { SparkCaptureModal } from "./SparkCaptureModal";

export function BottomCaptureBar() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className="sf-capture-bar">
        <div>
          <strong>灵光一闪</strong>
          <span>我会判断它是否值得继续追踪</span>
        </div>
        <button aria-label="记录灵光一闪" onClick={() => setIsOpen(true)} type="button">
          +
        </button>
      </div>
      <SparkCaptureModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
