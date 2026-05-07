import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Dialog } from "@/components/ui/Dialog";
import { StarRating } from "@/components/ui/StarRating";
import { StepInputRow } from "@/components/ui/StepInputRow";
import { ToggleGroup } from "@/components/ui/ToggleGroup";
import type { ThumbState } from "@/lib/sort-videos";

function SheetHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={triggerRef} onClick={() => setOpen(true)}>
        기록하기
      </Button>
      <button>outside</button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="시도 기록"
        triggerRef={triggerRef}
      >
        <input aria-label="rating" />
        <button>save</button>
      </BottomSheet>
    </>
  );
}

function DialogHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Button ref={triggerRef} onClick={() => setOpen(true)}>
        기록하기
      </Button>
      <button>outside</button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="시도 기록"
        triggerRef={triggerRef}
      >
        <input aria-label="rating" />
        <button>save</button>
      </Dialog>
    </>
  );
}

describe("component a11y TC-09~TC-14, TC-21~TC-22", () => {
  it("TC-09 BottomSheet moves focus to the first field", async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    await user.click(screen.getByRole("button", { name: "기록하기" }));
    expect(screen.getByLabelText("rating")).toHaveFocus();
  });

  it("TC-10 BottomSheet closes on ESC and restores trigger focus", async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    await user.click(screen.getByRole("button", { name: "기록하기" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기록하기" })).toHaveFocus();
  });

  it("TC-11 BottomSheet traps focus", async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    await user.click(screen.getByRole("button", { name: "기록하기" }));
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "save" })).toHaveFocus();
  });

  it("TC-12 Dialog follows the same focus and ESC pattern", async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole("button", { name: "기록하기" }));
    expect(screen.getByLabelText("rating")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기록하기" })).toHaveFocus();
  });

  it("TC-13 ToggleGroup exposes aria-pressed state transitions", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState<ThumbState>(null);
      return <ToggleGroup value={value} onChange={setValue} />;
    }
    render(<Harness />);
    const up = screen.getByRole("button", { name: "좋아요" });
    const down = screen.getByRole("button", { name: "싫어요" });
    await user.click(up);
    expect(up).toHaveAttribute("aria-pressed", "true");
    await user.click(up);
    expect(up).toHaveAttribute("aria-pressed", "false");
    await user.click(down);
    expect(down).toHaveAttribute("aria-pressed", "true");
  });

  it("TC-14 StarRating ArrowRight increments by 0.5", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState(1);
      return <StarRating value={value} onChange={setValue} />;
    }
    render(<Harness />);
    const slider = screen.getByRole("slider");
    slider.focus();
    await user.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "1.5");
  });

  it("TC-21 StepInputRow captures current iframe time", async () => {
    const user = userEvent.setup();
    render(<StepInputRow embedAvailable getCurrentTime={() => 83} />);
    await user.click(
      screen.getByRole("button", { name: "현재 재생 시간 기록" }),
    );
    expect(screen.getByLabelText("수동 재생 시간")).toHaveValue("1:23");
  });

  it("TC-22 disables capture when embed is blocked and accepts manual input", async () => {
    const user = userEvent.setup();
    render(<StepInputRow embedAvailable={false} />);
    expect(
      screen.getByRole("button", { name: "현재 재생 시간 기록" }),
    ).toHaveAttribute("aria-disabled", "true");
    await user.type(screen.getByLabelText("수동 재생 시간"), "2:05");
    expect(screen.getByLabelText("수동 재생 시간")).toHaveValue("2:05");
  });

  it("Combobox exposes required autocomplete roles and keyboard selection", async () => {
    const user = userEvent.setup();
    render(
      <Combobox label="메뉴 검색" options={[{ id: "1", label: "제육볶음" }]} />,
    );
    const input = screen.getByRole("combobox", { name: "메뉴 검색" });
    await user.type(input, "제육");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(input).toHaveValue("제육볶음");
  });
});
