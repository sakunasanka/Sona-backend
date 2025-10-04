import { sequelize } from '../config/db';
import { QueryTypes } from 'sequelize';

export interface ClientListFilters {
  page?: number;
  limit?: number;
  search?: string;
  filter?: 'all' | 'active' | 'inactive' | 'new';
  sort?: 'name' | 'last_session' | 'join_date';
}

export interface ClientData {
  id: number;
  name: string;
  avatar: string;
  student_id: string | null;
  is_anonymous: boolean;
  status: string;
  last_session: string | null;
  total_sessions: number;
  next_appointment: string | null;
  progress_status: string;
}

export interface ClientListResponse {
  clients: ClientData[];
  pagination: {
    current_page: number;
    total: number;
    total_pages: number;
  };
  stats: {
    total_clients: number;
    active_clients: number;
    new_clients: number;
  };
}

class CounselorClientService {
  /**
   * Get all clients for a specific counselor with pagination and filtering
   */
  async getCounselorClients(
    counselorId: number,
    filters: ClientListFilters = {}
  ): Promise<ClientListResponse> {
    const {
      page = 1,
      limit = 20,
      search = '',
      filter = 'all',
      sort = 'name'
    } = filters;

    const offset = (page - 1) * limit;

    try {
      // Use named parameters to avoid confusion
      let clientsQuery = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.avatar,
          COALESCE(c."nickName", CONCAT('STU', LPAD(u.id::text, 7, '0'))) as student_id,
          c."isStudent",
          CASE 
            WHEN c."nickName" IS NOT NULL AND c."nickName" != '' THEN false 
            ELSE true 
          END as is_anonymous,
          CASE 
            WHEN MAX(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) >= NOW() - INTERVAL '30 days' THEN 'active'
            WHEN MAX(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) IS NOT NULL THEN 'inactive'
            ELSE 'new'
          END as status,
          MAX(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) as last_session_date,
          COUNT(CASE WHEN s."counselorId" = :counselorId THEN 1 END) as total_sessions,
          CASE 
            WHEN COUNT(CASE WHEN s."counselorId" = :counselorId THEN 1 END) = 0 THEN 'new'
            WHEN COUNT(CASE WHEN s."counselorId" = :counselorId THEN 1 END) <= 3 THEN 'starting'
            WHEN COUNT(CASE WHEN s."counselorId" = :counselorId THEN 1 END) <= 8 THEN 'progressing'
            ELSE 'established'
          END as progress_status
        FROM users u
        JOIN clients c ON u.id = c."userId"
        LEFT JOIN sessions s ON u.id = s."userId"
        WHERE u.role = 'Client'
      `;

      // Build parameters object
      const params: any = { counselorId };

      // Add search filter
      if (search) {
        clientsQuery += ` AND (u.name ILIKE :searchTerm OR c."nickName" ILIKE :searchTerm)`;
        params.searchTerm = `%${search}%`;
      }

      // Add group by
      clientsQuery += ` GROUP BY u.id, u.name, u.avatar, c."nickName", c."isStudent"`;
      
      // Add having clause
      clientsQuery += ` HAVING COUNT(CASE WHEN s."counselorId" = :counselorId THEN 1 END) > 0`;

      // Add filter conditions
      if (filter === 'active') {
        clientsQuery += ` AND MAX(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) >= NOW() - INTERVAL '30 days'`;
      } else if (filter === 'inactive') {
        clientsQuery += ` AND MAX(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) < NOW() - INTERVAL '30 days'`;
      } else if (filter === 'new') {
        clientsQuery += ` AND MIN(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) >= NOW() - INTERVAL '7 days'`;
      }

      // Add sorting
      if (sort === 'name') {
        clientsQuery += ` ORDER BY u.name ASC`;
      } else if (sort === 'last_session') {
        clientsQuery += ` ORDER BY last_session_date DESC NULLS LAST`;
      } else if (sort === 'join_date') {
        clientsQuery += ` ORDER BY MIN(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) ASC NULLS LAST`;
      }

      // Add pagination
      clientsQuery += ` LIMIT :limit OFFSET :offset`;
      params.limit = limit;
      params.offset = offset;

      // Build count query
      let countQuery = `
        SELECT COUNT(*) as total
        FROM (
          SELECT u.id
          FROM users u
          JOIN clients c ON u.id = c."userId"
          LEFT JOIN sessions s ON u.id = s."userId"
          WHERE u.role = 'Client'
      `;

      // Count query parameters
      const countParams: any = { counselorId };
      
      if (search) {
        countQuery += ` AND (u.name ILIKE :searchTerm OR c."nickName" ILIKE :searchTerm)`;
        countParams.searchTerm = `%${search}%`;
      }

      countQuery += ` GROUP BY u.id
          HAVING COUNT(CASE WHEN s."counselorId" = :counselorId THEN 1 END) > 0`;

      // Add filter to count query  
      if (filter === 'active') {
        countQuery += ` AND MAX(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) >= NOW() - INTERVAL '30 days'`;
      } else if (filter === 'inactive') {
        countQuery += ` AND MAX(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) < NOW() - INTERVAL '30 days'`;
      } else if (filter === 'new') {
        countQuery += ` AND MIN(CASE WHEN s."counselorId" = :counselorId THEN s."createdAt" END) >= NOW() - INTERVAL '7 days'`;
      }

      countQuery += `) as client_count`;

      // Stats query
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT u.id) as total_clients,
          COUNT(DISTINCT CASE 
            WHEN s."createdAt" >= NOW() - INTERVAL '30 days' THEN u.id 
          END) as active_clients,
          COUNT(DISTINCT CASE 
            WHEN s."createdAt" >= NOW() - INTERVAL '7 days' 
            AND s.id = (
              SELECT MIN(s2.id) 
              FROM sessions s2 
              WHERE s2."userId" = u.id AND s2."counselorId" = :counselorId
            ) THEN u.id 
          END) as new_clients
        FROM users u
        JOIN clients c ON u.id = c."userId"
        JOIN sessions s ON u.id = s."userId" AND s."counselorId" = :counselorId
      `;
      
      const statsParams = { counselorId };

      // Execute queries
      const [clientsResult, countResult, statsResult] = await Promise.all([
        sequelize.query(clientsQuery, {
          replacements: params,
          type: QueryTypes.SELECT
        }),
        sequelize.query(countQuery, {
          replacements: countParams,
          type: QueryTypes.SELECT
        }),
        sequelize.query(statsQuery, {
          replacements: statsParams,
          type: QueryTypes.SELECT
        })
      ]);

      // Process results
      const clients: ClientData[] = (clientsResult as any[]).map((row: any) => ({
        id: row.id,
        name: row.name,
        avatar: row.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        student_id: row.student_id,
        is_anonymous: row.is_anonymous,
        status: row.status,
        last_session: row.last_session_date ? new Date(row.last_session_date).toISOString() : null,
        total_sessions: parseInt(row.total_sessions) || 0,
        next_appointment: null, // Will be implemented later if needed
        progress_status: row.progress_status
      }));

      const totalCount = (countResult as any[])[0]?.total || 0;
      const stats = (statsResult as any[])[0] || {
        total_clients: 0,
        active_clients: 0,
        new_clients: 0
      };

      return {
        clients,
        pagination: {
          current_page: page,
          total: parseInt(totalCount),
          total_pages: Math.ceil(totalCount / limit)
        },
        stats: {
          total_clients: parseInt(stats.total_clients) || 0,
          active_clients: parseInt(stats.active_clients) || 0,
          new_clients: parseInt(stats.new_clients) || 0
        }
      };

    } catch (error) {
      console.error('Error fetching counselor clients:', error);
      throw new Error(`Failed to fetch counselor clients: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get client statistics for a counselor
   */
  async getCounselorClientStats(counselorId: number) {
    try {
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT u.id) as total_clients,
          COUNT(DISTINCT CASE 
            WHEN s."createdAt" >= NOW() - INTERVAL '30 days' THEN u.id 
          END) as active_clients,
          COUNT(DISTINCT CASE 
            WHEN s."createdAt" >= NOW() - INTERVAL '7 days' 
            AND s.id = (
              SELECT MIN(s2.id) 
              FROM sessions s2 
              WHERE s2."userId" = u.id AND s2."counselorId" = ?
            ) THEN u.id 
          END) as new_clients,
          COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM sessions s2 
              WHERE s2."userId" = u.id 
              AND s2."counselorId" = ? 
              AND s2."createdAt" >= NOW() - INTERVAL '30 days'
            ) THEN u.id 
          END) as inactive_clients
        FROM users u
        JOIN clients c ON u.id = c."userId"
        JOIN sessions s ON u.id = s."userId" AND s."counselorId" = ?
      `;

      const result = await sequelize.query(statsQuery, {
        replacements: [counselorId, counselorId, counselorId],
        type: QueryTypes.SELECT
      });

      return (result as any[])[0] || {
        total_clients: 0,
        active_clients: 0,
        new_clients: 0,
        inactive_clients: 0
      };

    } catch (error) {
      console.error('Error fetching counselor client stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch client stats: ${errorMessage}`);
    }
  }

  /**
   * Get detailed information about a specific client
   */
  async getClientDetails(counselorId: number, clientId: number) {
    try {
      // First verify that the client has sessions with this counselor
      const accessQuery = `
        SELECT COUNT(*) as session_count
        FROM sessions s
        WHERE s."userId" = :clientId AND s."counselorId" = :counselorId
      `;

      const accessResult = await sequelize.query(accessQuery, {
        replacements: { clientId, counselorId },
        type: QueryTypes.SELECT
      });

      const sessionCount = (accessResult as any[])[0]?.session_count || 0;
      if (sessionCount === 0) {
        throw new Error('Client not found or no sessions with this counselor');
      }

      // Main client details query
      const clientQuery = `
        SELECT DISTINCT
          u.id,
          u.name,
          u.avatar,
          u.email,
          u."createdAt" as join_date,
          COALESCE(c."nickName", CONCAT('STU', LPAD(u.id::text, 7, '0'))) as student_id,
          c."isStudent",
          COALESCE(c."concerns", '[]'::jsonb) AS concerns,
          CASE 
            WHEN c."nickName" IS NOT NULL AND c."nickName" != '' THEN false 
            ELSE true 
          END as is_anonymous,
          true as is_verified,
          CASE 
            WHEN MAX(s."createdAt") >= NOW() - INTERVAL '30 days' THEN 'active'
            WHEN MAX(s."createdAt") IS NOT NULL THEN 'inactive'
            ELSE 'new'
          END as status,
          MAX(s."createdAt") as last_session,
          COUNT(s.id) as total_sessions,
          MIN(s."createdAt") as first_session,
          CASE 
            WHEN COUNT(s.id) = 0 THEN 'new'
            WHEN COUNT(s.id) <= 3 THEN 'starting'
            WHEN COUNT(s.id) <= 8 THEN 'progressing'
            ELSE 'established'
          END as progress_status,
          NULL as average_rating,
          ROUND(CAST((COUNT(CASE WHEN s.status = 'completed' THEN 1 END)::float / NULLIF(COUNT(s.id), 0)) * 100 AS NUMERIC), 1) as attendance_rate
        FROM users u
        JOIN clients c ON u.id = c."userId"
        LEFT JOIN sessions s ON u.id = s."userId" AND s."counselorId" = :counselorId
        WHERE u.id = :clientId AND u.role = 'Client'
        GROUP BY u.id, u.name, u.avatar, u.email, u."createdAt", c."nickName", c."isStudent", c."concerns"
      `;

      // Sessions query
      const sessionsQuery = `
        SELECT 
          s.id,
          s."createdAt" as date,
          s.duration,
          COALESCE(s.notes, '') as notes,
          s.status
        FROM sessions s
        WHERE s."userId" = :clientId AND s."counselorId" = :counselorId
        ORDER BY s."createdAt" DESC
        LIMIT 10
      `;

      // Notes query from client_notes table (exclude deleted notes)
      const notesQuery = `
        SELECT 
          cn.id,
          cn.content,
          cn."createdAt" as created_at,
          u.name as created_by,
          cn."isPrivate" as is_private,
          COALESCE(cn."isDeleted", false) as is_deleted,
          cn."createdBy" as counselor_id
        FROM client_notes cn
        JOIN users u ON cn."createdBy" = u.id
        WHERE cn."clientId" = :clientId 
        AND (cn."isDeleted" = false OR cn."isDeleted" IS NULL)
        ORDER BY cn."createdAt" DESC
        LIMIT 10
      `;

      // Execute queries
      const [clientResult, sessionsResult, notesResult] = await Promise.all([
        sequelize.query(clientQuery, {
          replacements: { clientId, counselorId },
          type: QueryTypes.SELECT
        }),
        sequelize.query(sessionsQuery, {
          replacements: { clientId, counselorId },
          type: QueryTypes.SELECT
        }),
        sequelize.query(notesQuery, {
          replacements: { clientId, counselorId },
          type: QueryTypes.SELECT
        })
      ]);

      const client = (clientResult as any[])[0];
      if (!client) {
        throw new Error('Client not found');
      }

      const sessions = (sessionsResult as any[]).map((session: any) => ({
        id: session.id,
        date: session.date,
        duration: session.duration || 60,
        type: 'video_call', // Static for now
        status: session.status || 'completed',
        concerns: [], // No per-session concerns for now
        notes: session.notes || '',
        rating: 5 // Static for now
      }));

      const notes = (notesResult as any[]).map((note: any) => ({
        id: note.id,
        content: note.content,
        created_at: note.created_at,
        created_by: note.created_by,
        is_private: note.is_private,
        is_deleted: note.is_deleted,
        counselor_id: note.counselor_id
      }));

      // Build response
      const clientDetails = {
        id: client.id,
        name: client.name,
        avatar: client.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        student_id: client.student_id,
        email: client.email,
        phone: "+1234567890", // Static for now - will be dynamic when phone field is added
        age: 22, // Static for now - will be dynamic when age field is added
        gender: "Male", // Static for now - will be dynamic when gender field is added
        address: "123 University Street, City", // Static for now - will be dynamic when address field is added
        is_anonymous: client.is_anonymous,
        is_verified: client.is_verified,
        status: client.status,
        last_session: client.last_session ? new Date(client.last_session).toISOString() : null,
        total_sessions: parseInt(client.total_sessions) || 0,
        next_appointment: null, // Will be implemented with appointment system
        progress_status: client.progress_status,
        join_date: client.first_session ? new Date(client.first_session).toISOString() : null,
        institution: "University of Technology", // Static for now - will be dynamic when institution field is added
        program: "Computer Science", // Static for now - will be dynamic when program field is added
        year: "3rd Year", // Static for now - will be dynamic when year field is added
        referred_by: "University Counseling Center", // Static for now - will be dynamic when referred_by field is added
        concerns: Array.isArray(client.concerns) ? client.concerns : [],
        emergency_contact: {
          name: "Jane Doe",
          relationship: "Mother",
          phone: "+1234567891"
        }, // Will be implemented with emergency contacts system
        preferences: {
          session_type: "video_call",
          preferred_time: "afternoon",
          language: "English",
          notifications: true
        }, // Will be dynamic when preferences system is implemented
        notes: notes,
        sessions: sessions,
        analytics: {
          attendance_rate: parseFloat(client.attendance_rate) || 100,
          average_rating: parseFloat(client.average_rating) || null,
          mood_trend: "improving", // Will be dynamic when mood tracking is implemented
          session_completion_rate: parseFloat(client.attendance_rate) || 95
        }
      };

      return clientDetails;

    } catch (error) {
      console.error('Error fetching client details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch client details: ${errorMessage}`);
    }
  }

  /**
   * Create a new note for a client
   */
  async createClientNote(counselorId: number, clientId: number, noteData: {
    content: string;
    isPrivate?: boolean;
  }) {
    try {
      // First verify that the client has sessions with this counselor
      const accessQuery = `
        SELECT COUNT(*) as session_count
        FROM sessions s
        WHERE s."userId" = :clientId AND s."counselorId" = :counselorId
      `;

      const accessResult = await sequelize.query(accessQuery, {
        replacements: { clientId, counselorId },
        type: QueryTypes.SELECT
      });

      const sessionCount = (accessResult as any[])[0]?.session_count || 0;
      if (sessionCount === 0) {
        throw new Error('Client not found or no sessions with this counselor');
      }

      // Insert the note
      const insertQuery = `
        INSERT INTO client_notes (
          "clientId", 
          content, 
          "isPrivate", 
          "createdBy", 
          "createdAt", 
          "updatedAt"
        )
        VALUES (
          :clientId, 
          :content, 
          :isPrivate, 
          :counselorId, 
          NOW(), 
          NOW()
        )
        RETURNING id, content, "isPrivate", "createdAt"
      `;

      const insertResult = await sequelize.query(insertQuery, {
        replacements: {
          clientId,
          counselorId,
          content: noteData.content,
          isPrivate: noteData.isPrivate || false
        },
        type: QueryTypes.SELECT
      });

      const newNote = (insertResult as any[])[0];

      // Get counselor name for response
      const counselorQuery = `
        SELECT name FROM users WHERE id = :counselorId
      `;

      const counselorResult = await sequelize.query(counselorQuery, {
        replacements: { counselorId },
        type: QueryTypes.SELECT
      });

      const counselorName = (counselorResult as any[])[0]?.name || 'Unknown';

      return {
        id: newNote.id,
        content: newNote.content,
        isPrivate: newNote.isPrivate,
        createdAt: newNote.createdAt,
        createdBy: counselorName,
        clientId: clientId,
        counselorId: counselorId
      };

    } catch (error) {
      console.error('Error creating client note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create client note: ${errorMessage}`);
    }
  }

  /**
   * Soft delete a client note (only if created by the current counselor)
   */
  async deleteClientNote(counselorId: number, noteId: number) {
    try {
      // First check if the note exists and was created by this counselor
      const checkQuery = `
        SELECT 
          cn.id,
          cn."clientId",
          cn."createdBy",
          cn."isDeleted",
          u.name as client_name
        FROM client_notes cn
        JOIN users u ON cn."clientId" = u.id
        WHERE cn.id = :noteId AND cn."createdBy" = :counselorId 
        AND (cn."isDeleted" = false OR cn."isDeleted" IS NULL)
      `;

      const checkResult = await sequelize.query(checkQuery, {
        replacements: { noteId, counselorId },
        type: QueryTypes.SELECT
      });

      if (checkResult.length === 0) {
        throw new Error('Note not found, already deleted, or you do not have permission to delete this note');
      }

      const note = (checkResult as any[])[0];

      // Verify the counselor has sessions with this client
      const accessQuery = `
        SELECT COUNT(*) as session_count
        FROM sessions s
        WHERE s."userId" = :clientId AND s."counselorId" = :counselorId
      `;

      const accessResult = await sequelize.query(accessQuery, {
        replacements: { clientId: note.clientId, counselorId },
        type: QueryTypes.SELECT
      });

      const sessionCount = (accessResult as any[])[0]?.session_count || 0;
      if (sessionCount === 0) {
        throw new Error('Access denied: No sessions with this client');
      }

      // Soft delete the note by setting isDeleted to true
      const deleteQuery = `
        UPDATE client_notes 
        SET "isDeleted" = true, "updatedAt" = NOW()
        WHERE id = :noteId AND "createdBy" = :counselorId
        RETURNING id, "clientId", content, "isDeleted", "updatedAt"
      `;

      const deleteResult = await sequelize.query(deleteQuery, {
        replacements: { noteId, counselorId },
        type: QueryTypes.SELECT
      });

      const deletedNote = (deleteResult as any[])[0];
      if (!deletedNote) {
        throw new Error('Failed to delete note');
      }

      return {
        id: deletedNote.id,
        clientId: deletedNote.clientId,
        clientName: note.client_name,
        content: deletedNote.content,
        isDeleted: deletedNote.isDeleted,
        deletedAt: deletedNote.updatedAt,
        deletedBy: counselorId
      };

    } catch (error) {
      console.error('Error deleting client note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete client note: ${errorMessage}`);
    }
  }

  /**
   * Update a client note (only if created by the current counselor)
   */
  async updateClientNote(counselorId: number, noteId: number, noteData: {
    content: string;
    isPrivate?: boolean;
  }) {
    try {
      // First check if the note exists and was created by this counselor
      const checkQuery = `
        SELECT 
          cn.id,
          cn."clientId",
          cn."createdBy",
          cn."isDeleted",
          u.name as client_name
        FROM client_notes cn
        JOIN users u ON cn."clientId" = u.id
        WHERE cn.id = :noteId AND (cn."isDeleted" = false OR cn."isDeleted" IS NULL)
      `;

      const checkResult = await sequelize.query(checkQuery, {
        replacements: { noteId },
        type: QueryTypes.SELECT
      });

      if (checkResult.length === 0) {
        throw new Error('Note not found or already deleted');
      }

      const note = (checkResult as any[])[0];

      // Check if the note was created by the current counselor
      if (note.createdBy !== counselorId) {
        throw new Error('You can only edit notes that you created');
      }

      // Verify the counselor has sessions with this client
      const accessQuery = `
        SELECT COUNT(*) as session_count
        FROM sessions s
        WHERE s."userId" = :clientId AND s."counselorId" = :counselorId
      `;

      const accessResult = await sequelize.query(accessQuery, {
        replacements: { clientId: note.clientId, counselorId },
        type: QueryTypes.SELECT
      });

      const sessionCount = (accessResult as any[])[0]?.session_count || 0;
      if (sessionCount === 0) {
        throw new Error('Access denied: No sessions with this client');
      }

      // Update the note
      const updateQuery = `
        UPDATE client_notes 
        SET 
          content = :content,
          "isPrivate" = :isPrivate,
          "updatedAt" = NOW()
        WHERE id = :noteId AND "createdBy" = :counselorId
        RETURNING id, "clientId", content, "isPrivate", "updatedAt"
      `;

      const updateResult = await sequelize.query(updateQuery, {
        replacements: { 
          noteId, 
          counselorId,
          content: noteData.content,
          isPrivate: noteData.isPrivate !== undefined ? noteData.isPrivate : false
        },
        type: QueryTypes.SELECT
      });

      const updatedNote = (updateResult as any[])[0];
      if (!updatedNote) {
        throw new Error('Failed to update note');
      }

      // Get counselor name for response
      const counselorQuery = `
        SELECT name FROM users WHERE id = :counselorId
      `;

      const counselorResult = await sequelize.query(counselorQuery, {
        replacements: { counselorId },
        type: QueryTypes.SELECT
      });

      const counselorName = (counselorResult as any[])[0]?.name || 'Unknown';

      return {
        id: updatedNote.id,
        clientId: updatedNote.clientId,
        clientName: note.client_name,
        content: updatedNote.content,
        isPrivate: updatedNote.isPrivate,
        updatedAt: updatedNote.updatedAt,
        updatedBy: counselorName,
        counselorId: counselorId
      };

    } catch (error) {
      console.error('Error updating client note:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update client note: ${errorMessage}`);
    }
  }

  /**
   * Add a concern to a client's concerns list (only if counselor has sessions with the client)
   */
  async addConcernToClient(counselorId: number, clientId: number, concern: string) {
    try {
      // Verify access: counselor must have at least one session with the client
      const accessQuery = `
        SELECT COUNT(*) as session_count
        FROM sessions s
        WHERE s."userId" = :clientId AND s."counselorId" = :counselorId
      `;

      const accessResult = await sequelize.query(accessQuery, {
        replacements: { clientId, counselorId },
        type: QueryTypes.SELECT
      });

      const sessionCount = (accessResult as any[])[0]?.session_count || 0;
      if (sessionCount === 0) {
        throw new Error('Access denied: No sessions with this client');
      }

      // Append concern to JSONB array if not already present
      const updateQuery = `
        UPDATE clients
        SET concerns = CASE
          WHEN NOT COALESCE(concerns, '[]'::jsonb) @> to_jsonb(ARRAY[:concern::text])
          THEN COALESCE(concerns, '[]'::jsonb) || to_jsonb(ARRAY[:concern::text])
          ELSE COALESCE(concerns, '[]'::jsonb)
        END,
        "updatedAt" = NOW()
        WHERE "userId" = :clientId
        RETURNING COALESCE(concerns, '[]'::jsonb) AS concerns
      `;

      const updateResult = await sequelize.query(updateQuery, {
        replacements: { clientId, concern },
        type: QueryTypes.SELECT
      });

      const row = (updateResult as any[])[0];
      if (!row) {
        throw new Error('Failed to update client concerns');
      }

      return {
        clientId,
        concerns: Array.isArray(row.concerns) ? row.concerns : row.concerns || []
      };

    } catch (error) {
      console.error('Error adding concern to client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add concern: ${errorMessage}`);
    }
  }

  /**
   * Remove a concern from a client's concerns list (only if counselor has sessions with the client)
   */
  async removeConcernFromClient(counselorId: number, clientId: number, concern: string) {
    try {
      // Verify access
      const accessQuery = `
        SELECT COUNT(*) as session_count
        FROM sessions s
        WHERE s."userId" = :clientId AND s."counselorId" = :counselorId
      `;

      const accessResult = await sequelize.query(accessQuery, {
        replacements: { clientId, counselorId },
        type: QueryTypes.SELECT
      });

      const sessionCount = (accessResult as any[])[0]?.session_count || 0;
      if (sessionCount === 0) {
        throw new Error('Access denied: No sessions with this client');
      }

      // Rebuild array excluding the concern (exact match)
      const updateQuery = `
        UPDATE clients
        SET concerns = (
          SELECT COALESCE(jsonb_agg(elem) FILTER (WHERE elem <> to_jsonb(:concern::text)), '[]'::jsonb)
          FROM jsonb_array_elements(COALESCE(concerns, '[]'::jsonb)) AS elem
        ),
        "updatedAt" = NOW()
        WHERE "userId" = :clientId
        RETURNING COALESCE(concerns, '[]'::jsonb) AS concerns
      `;

      const updateResult = await sequelize.query(updateQuery, {
        replacements: { clientId, concern },
        type: QueryTypes.SELECT
      });

      const row = (updateResult as any[])[0];
      if (!row) {
        throw new Error('Failed to update client concerns');
      }

      return {
        clientId,
        concerns: Array.isArray(row.concerns) ? row.concerns : row.concerns || []
      };

    } catch (error) {
      console.error('Error removing concern from client:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to remove concern: ${errorMessage}`);
    }
  }
}

export default new CounselorClientService();