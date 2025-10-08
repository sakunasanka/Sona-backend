import Student from '../models/Student';
import Client from '../models/Client';
import User from '../models/User';

export interface StudentApplicationData {
  clientId: number;
  university: string;
  universityId: string;
  universityEmail: string;
  graduationYear?: string;
  verificationDocument?: string;
}

class AdminStudentServices {
  async applyForStudentPackage(applicationData: StudentApplicationData) {
    const transaction = await Student.sequelize!.transaction();
    try {
      const client = await Client.findClientById(applicationData.clientId);
      if (!client) throw new Error('Client not found');

      const existingApplication = await Student.findOne({ where: { clientId: applicationData.clientId } });
      if (existingApplication) throw new Error('Student application already exists');

      const studentApplication = await Student.create({
        clientId: applicationData.clientId,
        university: applicationData.university,
        universityId: applicationData.universityId,
        universityEmail: applicationData.universityEmail,
        graduationYear: applicationData.graduationYear,
        verificationDocument: applicationData.verificationDocument,
        applicationStatus: 'pending',
        appliedDate: new Date()
      }, { transaction });

      await Client.updateClient(applicationData.clientId, { isStudent: true });

      await transaction.commit();
      return studentApplication;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateStudentApplicationStatus(
    clientId: number, 
    status: 'approved' | 'rejected', 
    rejectionReason?: string
  ) {
    const transaction = await Student.sequelize!.transaction();
    try {
      const studentApplication = await Student.findOne({ where: { clientId } });
      if (!studentApplication) throw new Error('Student application not found');

      await studentApplication.update({
        applicationStatus: status,
        ...(rejectionReason && { rejectionReason })
      }, { transaction });

      if (status === 'rejected') {
        await Client.updateClient(clientId, { isStudent: false });
      }

      await transaction.commit();
      return studentApplication;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPendingApplications() {
    return await Student.findAll({
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['userId'],
          include: [
            {
              model: User,
              as: 'user', // Specify the alias for the User model
              attributes: ['name', 'email', 'avatar'],
            },
          ],
        },
      ],
      where: { applicationStatus: 'pending' },
    });
  }

  async getStudentApplicationByClientId(clientId: number) {
    return await Student.findOne({ where: { clientId } });
  }
}

export default new AdminStudentServices();
