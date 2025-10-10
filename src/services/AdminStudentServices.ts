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
  async applyForStudentPackage(applicationData: StudentApplicationData) {
    try {
      const client = await Client.findClientById(applicationData.clientId);
      if (!client) throw new Error('Client not found');

      const existingApplication = await Student.findByClientId(applicationData.clientId);
      if (existingApplication) throw new Error('Student application already exists');

      const studentApplication = await Student.createStudentApplication({
        clientId: applicationData.clientId,
        fullName: applicationData.fullName,
        university: applicationData.university,
        studentIDCopy: applicationData.studentIDCopy,
        uniEmail: applicationData.uniEmail,
        applicationStatus: 'pending',
        rejectionReason: null
      });

      await Client.updateClient(applicationData.clientId, { isStudent: true });

      return studentApplication;
    } catch (error) {
      throw error;
    }
  }

  async updateStudentApplicationStatus(
    clientId: number, 
    status: 'approved' | 'rejected', 
    rejectionReason?: string
  ) {
    try {
      const studentApplication = await Student.findByClientId(clientId);
      if (!studentApplication) throw new Error('Student application not found');

      const updatedApplication = await Student.updateApplicationStatus(studentApplication.id, status, rejectionReason);

      if (status === 'rejected') {
        await Client.updateClient(clientId, { isStudent: false });
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
