import { sequelize } from "../config/db";
import { Transaction, QueryTypes, QueryInterface } from "sequelize";

interface InsertOptions {
  tableName: string;
  columns: string[];
  values: any[];
  transaction?: Transaction;
  returning?: string[];
}

export class DbHelpers {
  /**
   * Generic insert function
   * @param options - Insert configuration
   * @returns Promise<any[]> - Array of inserted records
   */
  static async insert(options: InsertOptions): Promise<any[]> {
    const { tableName, columns, values, transaction, returning = ['*'] } = options;

    try {
      // Validate input
      if (!tableName || !columns.length || !values.length) {
        throw new Error('tableName, columns, and values are required');
      }

      if (columns.length !== values.length) {
        throw new Error('columns and values arrays must have the same length');
      }

      // Build query
      const quotedColumns = columns.map(col => `"${col}"`).join(', ');
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      const returningClause = returning.length > 0 ? `RETURNING ${returning.map(col => `"${col}"`).join(', ')}` : '';

      const query = `
        INSERT INTO "${tableName}" (${quotedColumns})
        VALUES (${placeholders})
        ${returningClause}
      `.trim();

      console.log('Executing query:', query);
      console.log('With values:', values);

      // Fix: Use proper sequelize.query structure for INSERT with RETURNING
      const results = await sequelize.query(query, {
        bind: values,
        type: QueryTypes.SELECT, // Use SELECT for RETURNING queries in PostgreSQL
        transaction,
        raw: true // Ensure raw results
      });

      console.log('Query results:', results);
      return results as any[];
    } catch (error: any) {
      console.error('Database insert error:', error);
      console.error('Query details:', { tableName, columns, values });
      throw new Error(`Failed to insert into ${tableName}: ${error.message}`);
    }
  }

  /**
   * Generic bulk insert function
   * @param options - Bulk insert configuration
   * @returns Promise<any[]> - Array of inserted records
   */
  static async bulkInsert(options: {
    tableName: string;
    columns: string[];
    rows: any[][];
    transaction?: Transaction;
    returning?: string[];
  }): Promise<any[]> {
    const { tableName, columns, rows, transaction, returning = ['*'] } = options;

    if (!tableName || !columns.length || !rows.length) {
      throw new Error('tableName, columns, and rows are required');
    }

    // Build query
    const quotedColumns = columns.map(col => `"${col}"`).join(', ');
    const valueRows = rows.map((row, rowIndex) => {
      const placeholders = row.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ');
      return `(${placeholders})`;
    }).join(', ');

    const returningClause = returning.length > 0 ? `RETURNING ${returning.map(col => `"${col}"`).join(', ')}` : '';

    const query = `
      INSERT INTO "${tableName}" (${quotedColumns})
      VALUES ${valueRows}
      ${returningClause}
    `.trim();

    // Flatten values for replacements
    const flatValues = rows.flat();

    // Execute query
    const result = await sequelize.query(query, {
      replacements: flatValues,
      type: QueryTypes.INSERT,
      transaction
    });

    return result[0] as unknown as any[];
  }

  /**
   * Generic update function
   * @param options - Update configuration
   * @returns Promise<any[]> - Array of updated records
   */
  static async update(options: {
    tableName: string;
    set: { [key: string]: any };
    where: { [key: string]: any };
    transaction?: Transaction;
    returning?: string[];
  }): Promise<any[]> {
    const { tableName, set, where, transaction, returning = ['*'] } = options;

    // Build SET clause
    const setClause = Object.keys(set).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    const setValues = Object.values(set);

    // Build WHERE clause
    const whereClause = Object.keys(where).map((key, index) => `"${key}" = $${setValues.length + index + 1}`).join(' AND ');
    const whereValues = Object.values(where);

    const returningClause = returning.length > 0 ? `RETURNING ${returning.map(col => `"${col}"`).join(', ')}` : '';

    const query = `
      UPDATE "${tableName}"
      SET ${setClause}
      WHERE ${whereClause}
      ${returningClause}
    `.trim();

    // Execute query
    const result = await sequelize.query(query, {
      replacements: [...setValues, ...whereValues],
      type: QueryTypes.UPDATE,
      transaction
    });

    return result[0] as unknown as any[];
  }

  /**
   * Generic select function with joins
   * @param options - Select configuration
   * @returns Promise<any[]> - Array of selected records
   */
  static async select(options: {
    tableName: string;
    columns?: string[];
    joins?: { table: string; on: string; type?: 'INNER' | 'LEFT' | 'RIGHT' }[];
    where?: { [key: string]: any };
    orderBy?: string[];
    limit?: number;
    offset?: number;
    transaction?: Transaction;
  }): Promise<any[]> {
    const { tableName, columns = ['*'], joins = [], where = {}, orderBy = [], limit, offset, transaction } = options;

    // Build SELECT clause
    const selectClause = columns.map(col => col.includes('.') ? col : `"${col}"`).join(', ');

    // Build JOIN clauses
    const joinClauses = joins.map(join => `${join.type || 'INNER'} JOIN "${join.table}" ON ${join.on}`).join(' ');

    // Build WHERE clause
    const whereKeys = Object.keys(where);
    const whereClause = whereKeys.length > 0 ? `WHERE ${whereKeys.map((key, index) => `"${key}" = $${index + 1}`).join(' AND ')}` : '';
    const whereValues = Object.values(where);

    // Build ORDER BY clause
    const orderByClause = orderBy.length > 0 ? `ORDER BY ${orderBy.join(', ')}` : '';

    // Build LIMIT and OFFSET
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const offsetClause = offset ? `OFFSET ${offset}` : '';

    const query = `
      SELECT ${selectClause}
      FROM "${tableName}"
      ${joinClauses}
      ${whereClause}
      ${orderByClause}
      ${limitClause}
      ${offsetClause}
    `.trim();

    // Execute query
    const result = await sequelize.query(query, {
      replacements: whereValues,
      type: QueryTypes.SELECT,
      transaction
    });

    return result as any[];
  }
}