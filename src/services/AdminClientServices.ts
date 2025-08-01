// // src/services/client.service.ts
// import { Client, IClient, StudentPackageStatus } from '../models/Client';
// import { ItemNotFoundError } from '../utils/errors';

// export class ClientService {
//   static async getAllClients() {
//     return Client.find({});
//   }

//   static async getClientById(id: string) {
//     const client = await Client.findById(id);
//     if (!client) {
//       throw new ItemNotFoundError('Client not found');
//     }
//     return client;
//   }

//   static async searchClients(searchTerm: string, status?: string, clientType?: string) {
//     const query: any = {};
    
//     if (searchTerm) {
//       query.$or = [
//         { name: { $regex: searchTerm, $options: 'i' } },
//         { email: { $regex: searchTerm, $options: 'i' } },
//         { location: { $regex: searchTerm, $options: 'i' } }
//       ];
//     }
    
//     if (status && status !== 'All Status') {
//       query.status = status.toLowerCase();
//     }
    
//     if (clientType && clientType !== 'All Subscriptions') {
//       query.clientType = clientType.toLowerCase();
//     }
    
//     return Client.find(query);
//   }

//   static async updateStudentPackage(
//     clientId: string, 
//     status: StudentPackageStatus, 
//     rejectionReason?: string
//   ) {
//     const client = await Client.findById(clientId);
//     if (!client) {
//       throw new ItemNotFoundError('Client not found');
//     }

//     if (!client.studentPackage?.applied) {
//       throw new Error('Client has not applied for student package');
//     }

//     client.studentPackage.status = status;
//     if (status === 'rejected' && rejectionReason) {
//       client.studentPackage.rejectionReason = rejectionReason;
//     }
    
//     if (status === 'approved') {
//       client.subscriptionType = 'student';
//     }

//     await client.save();
//     return client;
//   }

//   static async getClientStats() {
//     const stats = await Client.aggregate([
//       {
//         $facet: {
//           totalClients: [{ $count: "count" }],
//           activeClients: [{ $match: { status: "active" } }, { $count: "count" }],
//           inactiveClients: [{ $match: { status: "inactive" } }, { $count: "count" }],
//           suspendedClients: [{ $match: { status: "suspended" } }, { $count: "count" }],
//           studentClients: [{ $match: { "studentPackage.applied": true } }, { $count: "count" }],
//           regularClients: [{ $match: { clientType: "regular" } }, { $count: "count" }],
//           totalRevenue: [{ $group: { _id: null, total: { $sum: "$totalSpent" } } }]
//         }
//       }
//     ]);

//     return {
//       totalClients: stats[0].totalClients[0]?.count || 0,
//       activeClients: stats[0].activeClients[0]?.count || 0,
//       inactiveClients: stats[0].inactiveClients[0]?.count || 0,
//       suspendedClients: stats[0].suspendedClients[0]?.count || 0,
//       studentClients: stats[0].studentClients[0]?.count || 0,
//       regularClients: stats[0].regularClients[0]?.count || 0,
//       totalRevenue: stats[0].totalRevenue[0]?.total || 0
//     };
//   }
// }