import sql from "../config/database.js";

export const getDatabaseHealth = async (req, res, next) => {
  try {
    const result = await sql`
      select
        current_database() as database,
        now() as server_time
    `;

    res.status(200).json({
      success: true,
      data: {
        database: result[0].database,
        serverTime: result[0].server_time
      }
    });
  } catch (error) {
    next(error);
  }
};