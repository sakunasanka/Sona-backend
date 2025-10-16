import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DatabaseError } from '../utils/errors';

class PsychiatristSession extends Model {
  public id!: number;
  public userId!: number;
  public psychiatristId!: number;
  public timeSlotId!: number;
  public date!: Date;
  public timeSlot!: string;
  public duration!: number;
  public price!: number;
  public concerns?: string;
  public status!: 'scheduled' | 'completed' | 'cancelled' | 'confirmed' | 'ongoing';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Create a new session booking
  static async createSession(sessionData: {
    userId: number;
    psychiatristId: number;
    timeSlotId: number;
    date: string;
    timeSlot: string;
    duration: number;
    price: number;
    concerns?: string;
  }): Promise<PsychiatristSession> {
    const transaction = await sequelize.transaction();

    try {
      const result = await sequelize.query(`
        INSERT INTO sessions (
          "userId",
          "counselorId", 
          "timeSlotId",
          date,
          "timeSlot",
          duration,
          price,
          concerns,
          status,
          "createdAt",
          "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `, {
        bind: [
          sessionData.userId,
          sessionData.psychiatristId,
          sessionData.timeSlotId,
          sessionData.date,
          sessionData.timeSlot,
          sessionData.duration,
          sessionData.price,
          sessionData.concerns || null,
          'confirmed'
        ],
        transaction,
        type: QueryTypes.INSERT
      });

      await transaction.commit();

      const session = new PsychiatristSession();
      const data = (result[0] as unknown as any[])[0];
      Object.assign(session, data);
      return session;
    } catch (error) {
      await transaction.rollback();
      throw new DatabaseError(`Failed to create session: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Find session by ID
  static async findSessionById(id: number): Promise<PsychiatristSession | null> {
    const result = await sequelize.query(`
      SELECT 
        ps.*,
        u.name as "userName",
        u.email as "userEmail",
        p.name as "psychiatristName",
        p.email as "psychiatristEmail"
      FROM psychiatrist_sessions ps
      JOIN users u ON ps."userId" = u.id
      JOIN users p ON ps."psychiatristId" = p.id
      WHERE ps.id = $1
    `, {
      bind: [id],
      type: QueryTypes.SELECT
    });

    if (result.length === 0) return null;

    const session = new PsychiatristSession();
    Object.assign(session, result[0]);
    return session;
  }

  // Get user's sessions
  static async getUserSessions(userId: number): Promise<PsychiatristSession[]> {
    const results = await sequelize.query(`
      SELECT 
        ps.*,
        p.name as "psychiatristName",
        p.email as "psychiatristEmail",
        pt.title as "psychiatristTitle"
      FROM psychiatrist_sessions ps
      JOIN users p ON ps."psychiatristId" = p.id
      JOIN psychiatrists pt ON p.id = pt."userId"
      WHERE ps."userId" = $1
      ORDER BY ps.date DESC, ps."timeSlot" DESC
    `, {
      bind: [userId],
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const session = new PsychiatristSession();
      Object.assign(session, data);
      return session;
    });
  }

  // Get psychiatrist's sessions
  static async getPsychiatristSessions(psychiatristId: number): Promise<PsychiatristSession[]> {
    const results = await sequelize.query(`
      SELECT 
        ps.*,
        u.name as "userName",
        u.email as "userEmail"
      FROM psychiatrist_sessions ps
      JOIN users u ON ps."userId" = u.id
      WHERE ps."psychiatristId" = $1
      ORDER BY ps.date DESC, ps."timeSlot" DESC
    `, {
      bind: [psychiatristId],
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const session = new PsychiatristSession();
      Object.assign(session, data);
      return session;
    });
  }

  // Cancel a session
  static async cancelSession(id: number, cancelledBy: 'user' | 'psychiatrist'): Promise<PsychiatristSession | null> {
    const transaction = await sequelize.transaction();

    try {
      // Update session status
      await sequelize.query(`
        UPDATE psychiatrist_sessions
        SET status = 'cancelled', "updatedAt" = NOW()
        WHERE id = $1
      `, {
        bind: [id],
        transaction,
        type: QueryTypes.UPDATE
      });

      // Get the session details to free up the time slot
      const sessionResult = await sequelize.query(`
        SELECT "timeSlotId" FROM psychiatrist_sessions WHERE id = $1
      `, {
        bind: [id],
        transaction,
        type: QueryTypes.SELECT
      });

      if (sessionResult.length > 0) {
        const timeSlotId = (sessionResult[0] as any).timeSlotId;
        
        // Free up the time slot
        await sequelize.query(`
          UPDATE time_slots
          SET "isBooked" = false, "updatedAt" = NOW()
          WHERE id = $1
        `, {
          bind: [timeSlotId],
          transaction,
          type: QueryTypes.UPDATE
        });
      }

      await transaction.commit();

      return this.findSessionById(id);
    } catch (error) {
      await transaction.rollback();
      throw new DatabaseError(`Failed to cancel session: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Update session status
  static async updateSessionStatus(id: number, status: 'scheduled' | 'completed' | 'cancelled' | 'confirmed' | 'ongoing'): Promise<PsychiatristSession | null> {
    try {
      await sequelize.query(`
        UPDATE psychiatrist_sessions
        SET status = $1, "updatedAt" = NOW()
        WHERE id = $2
      `, {
        bind: [status, id],
        type: QueryTypes.UPDATE
      });

      return this.findSessionById(id);
    } catch (error) {
      throw new DatabaseError(`Failed to update session status: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Get sessions by date range
  static async getSessionsByDateRange(psychiatristId: number, startDate: string, endDate: string): Promise<PsychiatristSession[]> {
    const results = await sequelize.query(`
      SELECT 
        ps.*,
        u.name as "userName",
        u.email as "userEmail"
      FROM psychiatrist_sessions ps
      JOIN users u ON ps."userId" = u.id
      WHERE ps."psychiatristId" = $1 
        AND ps.date >= $2 
        AND ps.date <= $3
      ORDER BY ps.date ASC, ps."timeSlot" ASC
    `, {
      bind: [psychiatristId, startDate, endDate],
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const session = new PsychiatristSession();
      Object.assign(session, data);
      return session;
    });
  }

  // Get upcoming sessions count for a user
  static async getUpcomingSessionsCount(userId: number): Promise<number> {
    const result = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM psychiatrist_sessions
      WHERE "userId" = $1 
        AND date >= CURRENT_DATE 
        AND status IN ('scheduled', 'confirmed')
    `, {
      bind: [userId],
      type: QueryTypes.SELECT
    });

    return parseInt((result[0] as any).count);
  }
}

PsychiatristSession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    psychiatristId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    timeSlotId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    timeSlot: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    concerns: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'confirmed', 'ongoing'),
      defaultValue: 'confirmed',
    }
  },
  {
    sequelize,
    modelName: 'psychiatristSession',
    tableName: 'psychiatrist_sessions',
    indexes: [
      {
        fields: ['userId'],
        name: 'idx_user_sessions'
      },
      {
        fields: ['psychiatristId'],
        name: 'idx_psychiatrist_sessions'
      },
      {
        fields: ['date', 'psychiatristId'],
        name: 'idx_date_psychiatrist'
      }
    ]
  }
);

// Set up associations
PsychiatristSession.belongsTo(User, { as: 'user', foreignKey: 'userId' });
PsychiatristSession.belongsTo(User, { as: 'psychiatrist', foreignKey: 'psychiatristId' });
User.hasMany(PsychiatristSession, { as: 'psychiatristSessions', foreignKey: 'userId' });
User.hasMany(PsychiatristSession, { as: 'psychiatristBookings', foreignKey: 'psychiatristId' });

export default PsychiatristSession;
