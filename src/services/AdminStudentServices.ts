import Student from '../models/Student';
import Client from '../models/Client';
import User from '../models/User';

export interface StudentApplicationData {
  clientId: number;
  fullName: string;
  university: string;
  studentIDCopy: string;
  uniEmail: string;
}

class AdminStudentServices {
//   async applyForStudentPackage(applicationData: StudentApplicationData) {
//     try {
//       const client = await Client.findClientById(applicationData.clientId);
//       if (!client) throw new Error('Client not found');

//       const existingApplication = await Student.findByClientId(applicationData.clientId);
//       if (existingApplication) throw new Error('Student application already exists');

//       const studentApplication = await Student.createStudentApplication({
//         clientId: applicationData.clientId,
//         fullName: applicationData.fullName,
//         university: applicationData.university,
//         studentIDCopy: applicationData.studentIDCopy,
//         uniEmail: applicationData.uniEmail,
//         applicationStatus: 'pending',
//         rejectionReason: null
//       });

//       await Client.updateClient(applicationData.clientId, { isStudent: true });

//       return studentApplication;
//     } catch (error) {
//       throw error;
//     }
//   }

 // In AdminStudentServices.ts
async updateStudentApplicationStatus(
    clientId: number, 
    status: 'approved' | 'rejected' | 'pending',  // Added 'pending' to status type
    rejectionReason?: string,
    rejectedById?: number
  ) {
    try {
      const studentApplication = await Student.findByClientId(clientId);
      if (!studentApplication) throw new Error('Student application not found');

      const updatedApplication = await Student.updateApplicationStatusInAdmin(
        studentApplication.id,
        status,
        rejectionReason || undefined,
        rejectedById
      );

      console.log('Status in Service:', status);
      console.log('Rejection Reason in Service:', rejectionReason);
      console.log('Rejected By in Service:', rejectedById);

      // Update client's isStudent status based on the new status
      if (status === 'rejected' || status === 'pending') {
        await Client.updateClient(clientId, { isStudent: false });
      }

      if (status === 'approved') {
        await Client.updateClient(clientId, { isStudent: true });
      }

      return updatedApplication;
    } catch (error) {
      throw error;
    }
  }

  async getPendingApplications() {
    return await Student.findAll('pending');
  }

  async getStudentApplicationByClientId(clientId: number) {
    return await Student.findByClientId(clientId);
  }
}

export default new AdminStudentServices();
