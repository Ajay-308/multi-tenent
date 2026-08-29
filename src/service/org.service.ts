import { orgMemberRepository } from "../repositories/org.repository.ts";
import { userRepository } from "../repositories/user.repository.ts";
import { toOffset, buildOffsetResult } from "../utils/pagination.ts";
import { Errors } from "../utils/error.ts";

function formatMember(row: {
  id: string;
  org_id: string;
  user_id: string;
  role: "org_admin" | "member";
  created_at: Date;
  name?: string;
  email?: string;
}) {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    user: row.name && row.email ? { name: row.name, email: row.email } : undefined,
  };
}

export const orgService = {
  async addMember(
    orgId: string,
    input: { userId?: string; email?: string; role: "org_admin" | "member" },
  ) {
    let userId = input.userId;
    if (!userId && input.email) {
      const user = await userRepository.findByEmail(input.email);
      if (!user) throw Errors.notFound("User", "USER_NOT_FOUND");
      userId = user.id;
    }

    const existing = await orgMemberRepository.findMembership(orgId, userId!);
    if (existing) {
      return { member: formatMember(existing), alreadyMember: true };
    }

    const created = await orgMemberRepository.add(orgId, userId!, input.role);
    if (!created) {
      const member = await orgMemberRepository.findMembership(orgId, userId!);
      return { member: formatMember(member!), alreadyMember: true };
    }

    const member = await orgMemberRepository.findMembership(orgId, userId!);
    return { member: formatMember(member!), alreadyMember: false };
  },

  async listMembers(
    orgId: string,
    pagination: { page: number; limit: number },
  ) {
    const offset = toOffset(pagination);
    const { rows, total } = await orgMemberRepository.list(orgId, {
      limit: pagination.limit,
      offset,
    });
    return buildOffsetResult(
      rows.map(formatMember),
      total,
      pagination.page,
      pagination.limit,
    );
  },
};
