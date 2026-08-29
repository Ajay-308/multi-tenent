import { projectRepository } from "../repositories/project.repository.ts";
import { toOffset, buildOffsetResult } from "../utils/pagination.ts";

export const projectService = {
  async create(
    orgId: string,
    userId: string,
    data: { name: string; description?: string },
  ) {
    return projectRepository.create(orgId, userId, data);
  },

  async list(orgId: string, pagination: { page: number; limit: number }) {
    const offset = toOffset(pagination);
    const { rows, total } = await projectRepository.list(orgId, {
      limit: pagination.limit,
      offset,
    });
    return buildOffsetResult(rows, total, pagination.page, pagination.limit);
  },

  async update(projectId: string, data: Record<string, unknown>) {
    return projectRepository.update(projectId, data);
  },

  async remove(projectId: string) {
    await projectRepository.softDelete(projectId);
  },

  async dashboard(projectId: string) {
    return projectRepository.dashboardCounts(projectId);
  },
};
