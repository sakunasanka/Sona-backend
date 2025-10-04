import { DataTypes, Model, QueryTypes } from 'sequelize';
import { sequelize } from '../config/db';
import User from './User';
import { DatabaseError } from '../utils/errors';

class PsychiatristTimeSlot extends Model {
  public id!: number;
  public psychiatristId!: number;  // Psychiatrist who has this time slot
  public date!: Date;  // Date of the time slot
  public time!: string;  // Time of the slot (e.g. "10:00")
  public isBooked!: boolean;  // Whether the slot is booked
  public isAvailable!: boolean;  // Whether the psychiatrist is available for this slot
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Create time slots for a psychiatrist
  static async createTimeSlots(psychiatristId: number, slots: {
    date: string;
    time: string;
  }[]): Promise<PsychiatristTimeSlot[]> {
    const transaction = await sequelize.transaction();
    
    try {
      const createdSlots: PsychiatristTimeSlot[] = [];
      
      for (const slot of slots) {
        const result = await sequelize.query(`
          INSERT INTO psychiatrist_time_slots (
            "psychiatristId", 
            date, 
            "time", 
            "isAvailable",
            "isBooked",
            "createdAt", 
            "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          RETURNING *
        `, {
          bind: [
            psychiatristId,
            slot.date,
            slot.time,
            true,
            false
          ],
          transaction,
          type: QueryTypes.INSERT
        });

        const timeSlot = new PsychiatristTimeSlot();
        const data = (result[0] as unknown as any[])[0];
        Object.assign(timeSlot, data);
        createdSlots.push(timeSlot);
      }

      await transaction.commit();
      return createdSlots;
    } catch (error) {
      await transaction.rollback();
      throw new DatabaseError(`Failed to create time slots: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Get available time slots for a specific date
  static async getAvailableSlots(psychiatristId: number, date: string): Promise<PsychiatristTimeSlot[]> {
    const results = await sequelize.query(`
      SELECT * FROM psychiatrist_time_slots
      WHERE "psychiatristId" = $1 
        AND date = $2 
        AND "isAvailable" = true 
        AND "isBooked" = false
      ORDER BY "time" ASC
    `, {
      bind: [psychiatristId, date],
      type: QueryTypes.SELECT
    });

    return results.map((data: any) => {
      const slot = new PsychiatristTimeSlot();
      Object.assign(slot, data);
      return slot;
    });
  }

  // Get monthly availability overview
  static async getMonthlyAvailability(psychiatristId: number, year: number, month: number): Promise<Record<string, any>> {
    const results = await sequelize.query(`
      SELECT 
        date,
        COUNT(*) as "totalSlots",
        COUNT(CASE WHEN "isAvailable" = true AND "isBooked" = false THEN 1 END) as "availableSlots"
      FROM psychiatrist_time_slots
      WHERE "psychiatristId" = $1 
        AND EXTRACT(YEAR FROM date) = $2 
        AND EXTRACT(MONTH FROM date) = $3
      GROUP BY date
      ORDER BY date ASC
    `, {
      bind: [psychiatristId, year, month],
      type: QueryTypes.SELECT
    });

    const availability: Record<string, any> = {};
    
    results.forEach((row: any) => {
      const dateStr = row.date;
      availability[dateStr] = {
        isAvailable: row.availableSlots > 0,
        totalSlots: parseInt(row.totalSlots),
        availableSlots: parseInt(row.availableSlots)
      };
    });

    return availability;
  }

  // Book a time slot
  static async bookTimeSlot(id: number): Promise<PsychiatristTimeSlot | null> {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if slot is still available
      const checkResult = await sequelize.query(`
        SELECT * FROM psychiatrist_time_slots
        WHERE id = $1 AND "isAvailable" = true AND "isBooked" = false
        FOR UPDATE
      `, {
        bind: [id],
        transaction,
        type: QueryTypes.SELECT
      });

      if (checkResult.length === 0) {
        await transaction.rollback();
        throw new Error('Time slot is no longer available');
      }

      // Book the slot
      await sequelize.query(`
        UPDATE psychiatrist_time_slots
        SET "isBooked" = true, "updatedAt" = NOW()
        WHERE id = $1
      `, {
        bind: [id],
        transaction,
        type: QueryTypes.UPDATE
      });

      await transaction.commit();

      // Return updated slot
      const result = await sequelize.query(`
        SELECT * FROM psychiatrist_time_slots WHERE id = $1
      `, {
        bind: [id],
        type: QueryTypes.SELECT
      });

      const slot = new PsychiatristTimeSlot();
      Object.assign(slot, result[0]);
      return slot;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Cancel booking (make slot available again)
  static async cancelBooking(id: number): Promise<PsychiatristTimeSlot | null> {
    try {
      await sequelize.query(`
        UPDATE psychiatrist_time_slots
        SET "isBooked" = false, "updatedAt" = NOW()
        WHERE id = $1
      `, {
        bind: [id],
        type: QueryTypes.UPDATE
      });

      const result = await sequelize.query(`
        SELECT * FROM psychiatrist_time_slots WHERE id = $1
      `, {
        bind: [id],
        type: QueryTypes.SELECT
      });

      const slot = new PsychiatristTimeSlot();
      Object.assign(slot, result[0]);
      return slot;
    } catch (error) {
      throw new DatabaseError(`Failed to cancel booking: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Set availability for existing slots
  static async setAvailability(psychiatristId: number, date: string, isAvailable: boolean): Promise<void> {
    try {
      await sequelize.query(`
        UPDATE psychiatrist_time_slots
        SET "isAvailable" = $1, "updatedAt" = NOW()
        WHERE "psychiatristId" = $2 AND date = $3
      `, {
        bind: [isAvailable, psychiatristId, date],
        type: QueryTypes.UPDATE
      });
    } catch (error) {
      throw new DatabaseError(`Failed to set availability: ` + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Get slot by ID
  static async findSlotById(id: number): Promise<PsychiatristTimeSlot | null> {
    const result = await sequelize.query(`
      SELECT * FROM psychiatrist_time_slots WHERE id = $1
    `, {
      bind: [id],
      type: QueryTypes.SELECT
    });

    if (result.length === 0) return null;

    const slot = new PsychiatristTimeSlot();
    Object.assign(slot, result[0]);
    return slot;
  }
}

PsychiatristTimeSlot.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    psychiatristId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isBooked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'psychiatristTimeSlot',
    tableName: 'psychiatrist_time_slots',
    indexes: [
      {
        fields: ['psychiatristId', 'date'],
        name: 'idx_psychiatrist_date'
      },
      {
        fields: ['psychiatristId', 'date', 'time'],
        name: 'idx_psychiatrist_datetime'
      }
    ]
  }
);

export default PsychiatristTimeSlot;
