import { taskRepository } from "../repositories/task.repositroy.ts";
import { orgMemberRepository } from "../repositories/org.repository.ts";
import { tryEnqueueAssignmentEmail } from "./notification.service.ts";
import { toOffset, buildOffsetResult } from "../utils/pagination.ts";
import { Errors } from "../utils/error.ts";

export const taskService = {
  async create(projectId: string, userId: string, data: any) {
    return taskRepository.create(projectId, userId, data);
  },

  async list(
    projectId: string,
    filters: any,
    pagination: { page: number; limit: number },
  ) {
    const offset = toOffset(pagination);
    const { rows, total } = await taskRepository.list(projectId, filters, {
      limit: pagination.limit,
      offset,
    });
    return buildOffsetResult(rows, total, pagination.page, pagination.limit);
  },

  async getAssignees(taskId: string) {
    return taskRepository.getAssignees(taskId);
  },

  async update(taskId: string, data: Record<string, unknown>) {
    return taskRepository.update(taskId, data);
  },

  async remove(taskId: string) {
    await taskRepository.softDelete(taskId);
  },

  // Verify assignee membership before creating the assignment.
  async assign(
    orgId: string,
    taskId: string,
    userId: string,
    assignedBy: string,
  ) {
    const isMember = await orgMemberRepository.isMember(orgId, userId);
    if (!isMember) {
      throw Errors.validation({
        userId: "User is not a member of this organization",
      });
    }
    const { assignment, outboxId } = await taskRepository.assign(
      taskId,
      userId,
      assignedBy,
    );

    if (outboxId && assignment) {
      await tryEnqueueAssignmentEmail(outboxId, {
        taskId,
        userId,
        assignedBy,
        assignmentId: assignment.id,
      });
    }

    return { assignment, alreadyAssigned: !assignment };
  },

  async unassign(taskId: string, userId: string) {
    const removed = await taskRepository.unassign(taskId, userId);
    if (!removed) throw Errors.notFound("Assignment", "ASSIGNMENT_NOT_FOUND");
  },

  async bulkUpdateStatus(projectId: string, taskIds: string[], status: string) {
    return taskRepository.bulkUpdateStatus(projectId, taskIds, status);
  },

  async search(
    projectId: string,
    query: string,
    pagination: { page: number; limit: number },
  ) {
    const offset = toOffset(pagination);
    const { rows, total } = await taskRepository.searchFullText(
      projectId,
      query,
      {
        limit: pagination.limit,
        offset,
      },
    );
    return buildOffsetResult(rows, total, pagination.page, pagination.limit);
  },
};
