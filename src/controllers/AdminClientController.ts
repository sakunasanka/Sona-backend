// import { Request, Response } from 'express';
// import { ClientService } from '../services/AdminClientServices';
// import { StudentPackageStatus } from '../models/Client';
// import { ItemNotFoundError } from '../utils/errors';

// export const getAllClients = async (req: Request, res: Response) => {
//   try {
//     const clients = await ClientService.getAllClients();
//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching clients' });
//   }
// };

// export const getClientById = async (req: Request, res: Response) => {
//   try {
//     const client = await ClientService.getClientById(req.params.id);
//     res.json(client);
//   } catch (error) {
//     if (error instanceof ItemNotFoundError) {
//       return res.status(404).json({ message: error.message });
//     }
//     res.status(500).json({ message: 'Error fetching client' });
//   }
// };

// export const searchClients = async (req: Request, res: Response) => {
//   try {
//     const { searchTerm, status, clientType } = req.query;
//     const clients = await ClientService.searchClients(
//       searchTerm as string,
//       status as string,
//       clientType as string
//     );
//     res.json(clients);
//   } catch (error) {
//     res.status(500).json({ message: 'Error searching clients' });
//   }
// };

// export const updateStudentPackageStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { status, rejectionReason } = req.body;
    
//     if (!['approved', 'rejected'].includes(status)) {
//       return res.status(400).json({ message: 'Invalid status' });
//     }

//     const client = await ClientService.updateStudentPackage(
//       id,
//       status as StudentPackageStatus,
//       rejectionReason
//     );
    
//     res.json(client);
//   } catch (error) {
//     if (error instanceof ItemNotFoundError) {
//       return res.status(404).json({ message: error.message });
//     }
//     res.status(500).json({ message: error.message || 'Error updating student package' });
//   }
// };

// export const getClientStats = async (req: Request, res: Response) => {
//   try {
//     const stats = await ClientService.getClientStats();
//     res.json(stats);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching client stats' });
//   }
// };