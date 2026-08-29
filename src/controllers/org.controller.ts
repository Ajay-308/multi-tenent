import type { Request, Response, NextFunction } from "express";
import { orgService } from "../service/org.service.ts";
import {
  addMemberSchema,
  listMembersQuerySchema,
} from "../validator/org.validator.ts";
import { Errors } from "../utils/error.ts";

export const orgController = {
  async addMember(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = addMemberSchema.safeParse(req.body);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const { member, alreadyMember } = await orgService.addMember(
        req.org!.id,
        parsed.data,
      );
      res.status(alreadyMember ? 200 : 201).json({
        member,
        alreadyMember,
      });
    } catch (err) {
      next(err);
    }
  },

  async listMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = listMembersQuerySchema.safeParse(req.query);
      if (!parsed.success) throw Errors.validation(parsed.error.flatten());
      const result = await orgService.listMembers(req.org!.id, parsed.data);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
};
