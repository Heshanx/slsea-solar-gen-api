import sql from "../config/database.js";

export const getDatabaseHealth = async (req, res, next) => {
  try {
    await sql`SELECT 1`;

    return res.status(200).json({
      success: true,
      data: {
        status: "healthy",
        service: "database"
      }
    });
  } catch (error) {
    return next(error);
  }
};