import { Request, Response } from 'express';
import mtMemberService from '../services/AdminMTMemberServices';
import { validationResult } from 'express-validator';


class AdminMTMemberController {
  async createMember(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const memberData = req.body;
      const newMember = await mtMemberService.createMember(memberData);
      res.status(201).json(newMember);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to create team member' });
    }
  }

  async getAllMembers(req: Request, res: Response) {
    try {
      const { searchTerm, department, sortBy, sortOrder } = req.query;
      const members = await mtMemberService.getAllMembers({
        searchTerm: searchTerm as string,
        department: department as string,
        sortBy: sortBy as 'name' | 'position' | 'department' | 'joinDate',
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch team members' });
    }
  }

  async getMemberById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const member = await mtMemberService.getMemberById(id);
      if (!member) {
        return res.status(404).json({ message: 'Team member not found' });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch team member' });
    }
  }

  async updateMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedMember = await mtMemberService.updateMember(id, updateData);
      res.json(updatedMember);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to update team member' });
    }
  }

  async rejectMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }

      const rejectedMember = await mtMemberService.rejectMember({
        memberId: id,
        reason,
      });
      res.json(rejectedMember);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to reject team member' });
    }
  }

  async deleteMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await mtMemberService.deleteMember(id);
      res.json({ message: 'Team member deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to delete team member' });
    }
  }

  async getDepartments(req: Request, res: Response) {
    try {
      const departments = await mtMemberService.getDepartments();
      res.json(['all', ...departments]);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'Failed to fetch departments' });
    }
  }
}

export default new AdminMTMemberController();