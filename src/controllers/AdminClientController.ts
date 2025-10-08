import { Request, Response } from 'express';
import clientService, { ClientFilters } from '../services/AdminClientServices';
import studentService from '../services/AdminStudentServices';

class AdminClientController {
  async getAllClients(req: Request, res: Response) {
    try {
      const filters: ClientFilters = {
        search: req.query.search as string,
        status: req.query.status as string,
        clientType: req.query.clientType as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50
      };

      console.log('Filters:', filters); // Log filters for debugging

      const clients = await clientService.getAllClients(filters);
      res.json({
        success: true,
        data: clients,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: clients.length
        }
      });
    } catch (error) {
      console.error('Error fetching clients:', error); // Log the error for debugging
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getClientById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const client = await clientService.getClientById(parseInt(id));

      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      res.json({
        success: true,
        data: client
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async getClientStats(req: Request, res: Response) {
    try {
      const stats = await clientService.getClientStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching client stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async updateClientStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const success = await clientService.updateClientStatus(parseInt(id), status);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Client not found or update failed'
        });
      }

      res.json({
        success: true,
        message: 'Client status updated successfully'
      });
    } catch (error) {
      console.error('Error updating client status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async approveStudentPackage(req: Request, res: Response) {
    try {
      const { clientId } = req.params;

      await studentService.updateStudentApplicationStatus(parseInt(clientId), 'approved');

      res.json({
        success: true,
        message: 'Student package approved successfully'
      });
    } catch (error) {
      console.error('Error approving student package:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async rejectStudentPackage(req: Request, res: Response) {
    try {
      const { clientId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      await studentService.updateStudentApplicationStatus(
        parseInt(clientId), 
        'rejected', 
        rejectionReason
      );

      res.json({
        success: true,
        message: 'Student package rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting student package:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  async getPendingStudentApplications(req: Request, res: Response) {
    try {
      const applications = await studentService.getPendingApplications();
      res.json({
        success: true,
        data: applications
      });
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new AdminClientController();