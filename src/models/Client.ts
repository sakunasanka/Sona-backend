import { DataTypes, QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import User from "./User";

class Client extends User {
  // Client-specific properties
  public isStudent!: boolean;
  public nickName?: string;


  // Override create to handle both tables
  static async createClient(userData: {
    firebaseId: string;
    name: string;
    email: string;
    avatar?: string;
    isStudent: boolean;
    nickName?: string;
  }) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create user first
      const user = await User.create({
        firebaseId: userData.firebaseId,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        role: 'Client',
      }, { transaction });

      // Create client record with same id
     

      // Note. following code gonna be use after fixing issues
      // await DbHelpers.insert({
      //   tableName: 'clients',
      //   columns: ['userId', 'isStudent', 'nickName', 'createdAt', 'updatedAt'],
      //   values: [user.id, userData.isStudent, userData.nickName, new Date(), new Date()],
      //   transaction,
      //   returning: ['id', 'userId', 'isStudent', 'nickName']
      // });

       //use "" marks since column names are case-insensitive in PostgreSQL
      await sequelize.query(`
        INSERT INTO clients (
                "userId", 
                "isStudent", 
                "nickName",
                "createdAt", 
                "updatedAt"
            )
        VALUES (?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          user.id,
          userData.isStudent,
          userData.nickName,
        ],
        transaction
      });

      await transaction.commit();
      
      // Return the client instance with all data
      const clientInstance = new Client();
      clientInstance.id = user.id;
      clientInstance.firebaseId = user.firebaseId;
      clientInstance.name = user.name;
      clientInstance.email = user.email;
      clientInstance.avatar = user.avatar;
      clientInstance.nickName = userData.nickName;
      clientInstance.isStudent = userData.isStudent;

      return clientInstance;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Find client with joined data
  static async findClientById(id: number): Promise<Client | null> {
    const result = await sequelize.query(`
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", u."email", u."avatar", u."role", u."createdAt", u."updatedAt",
        c."nickName", c."isStudent"
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.id = ? AND u."role" = 'Client'
    `, {
      replacements: [id],
      type: QueryTypes.SELECT
    });

    if (result.length === 0) return null;

    const data = result[0] as any;
    const client = new Client();
    
    // Set all properties
    client.id = data.id;
    client.firebaseId = data.firebaseId;
    client.name = data.name;
    client.email = data.email;
    client.avatar = data.avatar;
    client.role = data.userType; 
    client.isStudent = data.isStudent;
    client.nickName = data.nickName;

    return client;
  }

  static async findAllClients(): Promise<Client[]> {
    const results = await sequelize.query(`
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."userType", 
        u."createdAt", 
        u."updatedAt",
        c."nickName", 
        c."isStudent"
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.userType = 'Client'
    `, {
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const client = new Client();
      client.id = data.id;
      client.firebaseId = data.firebaseId;
      client.name = data.name;
      client.email = data.email;
      client.avatar = data.avatar;
      client.role = data.userType;
      client.nickName = data.nickName;
      client.isStudent = data.isStudent;
      return client;
    });
  }
}

export default Client;