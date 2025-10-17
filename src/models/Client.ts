import { DataTypes, Model, QueryTypes } from "sequelize";
import { sequelize } from "../config/db";
import User from "./User";

class Client extends User {
  public userId!: number; // Explicitly define userId as the primary key
  public firebaseId!: string;
  public name!: string;
  public email!: string;
  public avatar?: string;
  public role!: "Client" | "Counselor" | "Admin" | "Psychiatrist" | "MT-Team";
  public isStudent!: boolean;
  public nickName?: string;
  public concerns?: any[];

  // ✅ Define the association as a static method
  static associate(models: any) {
    // Define association with User
    Client.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
  }

  // ✅ The rest of your code remains unchanged below...
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
      const user = await User.create(
        {
          firebaseId: userData.firebaseId,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          role: "Client",
        },
        { transaction }
      );

      await sequelize.query(
        `
        INSERT INTO clients (
          "userId",
          "isStudent",
          "nickName",
          "createdAt",
          "updatedAt"
        )
        VALUES (?, ?, ?, NOW(), NOW())
        `,
        {
          replacements: [user.id, userData.isStudent, userData.nickName],
          transaction,
        }
      );

      await transaction.commit();

      const clientInstance = new Client();
      clientInstance.userId = user.id; // Use userId consistently
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
    const result = await sequelize.query(
      `
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

    client.userId = data.userId; // Use userId consistently
    client.firebaseId = data.firebaseId;
    client.name = data.name;
    client.email = data.email;
    client.avatar = data.avatar;
    client.role = data.role; 
    client.isStudent = data.isStudent;
    client.nickName = data.nickName;

    return client;
  }

  static async findAllClients(): Promise<Client[]> {
    const results = await sequelize.query(
      `
      SELECT 
        u.id, 
        u."firebaseId", 
        u."name", 
        u."email", 
        u."avatar", 
        u."role", 
        u."createdAt", 
        u."updatedAt",
        c."nickName", 
        c."isStudent"
      FROM users u
      JOIN clients c ON u.id = c."userId"
      WHERE u.role = 'Client'
    `, {
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const client = new Client();
      client.userId = data.userId; // Use userId consistently
      client.firebaseId = data.firebaseId;
      client.name = data.name;
      client.email = data.email;
      client.avatar = data.avatar;
      client.role = data.role;
      client.nickName = data.nickName;
      client.isStudent = data.isStudent;
      return client;
    });
  }

  static async updateClient(id: number, updateData: {
    name?: string;
    avatar?: string;
    nickName?: string;
    isStudent?: boolean;
    concerns?: any[];
  }) {
    const transaction = await sequelize.transaction();

    try {
      if (updateData.name || updateData.avatar) {
        await User.update(
          {
            ...(updateData.name && { name: updateData.name }),
            ...(updateData.avatar && { avatar: updateData.avatar }),
          },
          {
            where: { id },
            transaction,
          }
        );
      }

      if (
        updateData.nickName ||
        updateData.isStudent !== undefined ||
        updateData.concerns
      ) {
        await sequelize.query(
          `
          UPDATE clients 
          SET 
            ${updateData.nickName !== undefined ? `"nickName" = ?,` : ''}
            ${updateData.isStudent !== undefined ? `"isStudent" = ?,` : ''}
            ${updateData.concerns !== undefined ? `"concerns" = ?,` : ''}
            "updatedAt" = NOW()
          WHERE "userId" = ?
          `,
          {
            replacements: [
              ...(updateData.nickName !== undefined
                ? [updateData.nickName]
                : []),
              ...(updateData.isStudent !== undefined
                ? [updateData.isStudent]
                : []),
              ...(updateData.concerns !== undefined
                ? [updateData.concerns]
                : []),
              id,
            ].filter(value => value !== undefined), // Retain false and 0 values
            transaction,
          }
        );
      }

      await transaction.commit();
      return await this.findClientById(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

Client.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true, // Explicitly set userId as the primary key
    },
    isStudent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    nickName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    concerns: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "client",
    tableName: "clients",
    timestamps: true,
  }
);

export default Client;