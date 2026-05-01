import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";
import { describe, expect, it, vi } from "vitest";
import { NotificationList } from "../NotificationList";
import type { Notification } from "../../../types/notifications";

vi.mock("../NotificationItem", () => ({
  NotificationItem: ({
    notification,
    onRead,
  }: {
    notification: Notification;
    onRead: (id: string | number) => void;
  }) => (
    <button
      data-testid={`notification-item-${notification.id}`}
      onClick={() => onRead(notification.id)}
    >
      {notification.title}
    </button>
  ),
}));

vi.mock("../../loaders/SkeletonLoader", () => ({
  SkeletonLoader: () => <div data-testid="skeleton-loader">loading</div>,
}));

const notifications: Notification[] = [
  {
    id: "notif-1",
    type: "ESCROW_FUNDED",
    title: "Escrow funded",
    message: "Escrow funded successfully",
    time: "2026-03-24T10:00:00.000Z",
    isRead: false,
  },
];

describe("NotificationList", () => {
  it("renders empty state", () => {
    render(
      <NotificationList
        notifications={[]}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
      />,
    );

    expect(screen.getByText("You are all caught up")).toBeInTheDocument();
  });

  it("triggers mark all read callback", () => {
    const onMarkAllRead = vi.fn();

    render(
      <NotificationList
        notifications={notifications}
        onMarkAllRead={onMarkAllRead}
        onMarkRead={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("triggers load more when scrolled to bottom", () => {
    const onLoadMore = vi.fn();

    render(
      <NotificationList
        notifications={notifications}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
        onLoadMore={onLoadMore}
      />,
    );

    const scrollContainer = screen.getByTestId("notification-list-scroll");

    Object.defineProperty(scrollContainer, "scrollTop", {
      value: 400,
      writable: true,
    });
    Object.defineProperty(scrollContainer, "clientHeight", {
      value: 200,
      writable: true,
    });
    Object.defineProperty(scrollContainer, "scrollHeight", {
      value: 600,
      writable: true,
    });

    fireEvent.scroll(scrollContainer);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("renders 5 skeleton rows in loading state", () => {
    render(
      <NotificationList
        notifications={[]}
        onMarkAllRead={vi.fn()}
        onMarkRead={vi.fn()}
        isLoading
      />,
    );

    expect(screen.getAllByTestId("skeleton-loader")).toHaveLength(5);
  });
});
