import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const isMember = vi.fn();
const assign = vi.fn();
const enqueue = vi.fn();

vi.mock("../../src/repositories/org.repository.ts", () => ({
  orgMemberRepository: { isMember },
}));
vi.mock("../../src/repositories/task.repositroy.ts", () => ({
  taskRepository: { assign },
}));
vi.mock("../../src/service/notification.service.ts", () => ({
  tryEnqueueAssignmentEmail: enqueue,
}));

let taskService: (typeof import("../../src/service/task.service.ts"))["taskService"];

describe("task assignment service", () => {
  beforeAll(async () => {
    ({ taskService } = await import("../../src/service/task.service.ts"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects an assignee outside the organization", async () => {
    isMember.mockResolvedValue(false);

    await expect(
      taskService.assign("org-1", "task-1", "user-2", "user-1"),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("enqueues an email after a new assignment", async () => {
    isMember.mockResolvedValue(true);
    assign.mockResolvedValue({
      assignment: { id: "assignment-1" },
      outboxId: "outbox-1",
    });

    await expect(
      taskService.assign("org-1", "task-1", "user-2", "user-1"),
    ).resolves.toEqual({
      assignment: { id: "assignment-1" },
      alreadyAssigned: false,
    });
    expect(enqueue).toHaveBeenCalledWith("outbox-1", {
      taskId: "task-1",
      userId: "user-2",
      assignedBy: "user-1",
      assignmentId: "assignment-1",
    });
  });

  it("does not enqueue an email for a duplicate assignment", async () => {
    isMember.mockResolvedValue(true);
    assign.mockResolvedValue({ assignment: null, outboxId: null });

    await expect(
      taskService.assign("org-1", "task-1", "user-2", "user-1"),
    ).resolves.toEqual({ assignment: null, alreadyAssigned: true });
    expect(enqueue).not.toHaveBeenCalled();
  });
});
