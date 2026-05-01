import { act, render } from "@testing-library/react";
import { fireEvent, screen } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../ToastProvider";
import { useToast } from "../useToast";

function ToastTrigger() {
  const { showToast } = useToast();

  return (
    <div>
      <button
        onClick={() =>
          showToast({
            type: "success",
            title: "Success toast",
            message: "Saved",
          })
        }
      >
        Add success
      </button>
      <button
        onClick={() =>
          showToast({
            type: "error",
            title: "Error toast",
            message: "Failed",
          })
        }
      >
        Add error
      </button>
      <button
        onClick={() => {
          for (let index = 1; index <= 4; index += 1) {
            showToast({
              type: "info",
              title: `Info ${index}`,
              message: `Toast ${index}`,
            });
          }
        }}
      >
        Add four
      </button>
    </div>
  );
}

function renderToastProvider() {
  return render(
    <ToastProvider>
      <ToastTrigger />
    </ToastProvider>,
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("queues toasts and keeps maximum of 3 visible", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add four" }));
    expect(screen.getAllByTestId("toast-item")).toHaveLength(3);
    expect(screen.queryByText("Info 4")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss toast" })[0]);
    expect(screen.getAllByTestId("toast-item")).toHaveLength(3);
    expect(screen.getByText("Info 4")).toBeInTheDocument();
  });

  it("auto dismisses toasts based on default timers", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    fireEvent.click(screen.getByRole("button", { name: "Add error" }));

    expect(screen.getByText("Success toast")).toBeInTheDocument();
    expect(screen.getByText("Error toast")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.queryByText("Success toast")).not.toBeInTheDocument();
    expect(screen.getByText("Error toast")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
    });

    expect(screen.queryByText("Error toast")).not.toBeInTheDocument();
  });

  it("manually dismisses toast", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    expect(screen.getByText("Success toast")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss toast" }));
    expect(screen.queryByText("Success toast")).not.toBeInTheDocument();
  });

  it("sets correct accessibility role", () => {
    renderToastProvider();

    fireEvent.click(screen.getByRole("button", { name: "Add success" }));
    fireEvent.click(screen.getByRole("button", { name: "Add error" }));

    const statusToast = screen.getByText("Success toast").closest('[role="status"]');
    const alertToast = screen.getByText("Error toast").closest('[role="alert"]');

    expect(statusToast).toBeInTheDocument();
    expect(alertToast).toBeInTheDocument();
  });
});
