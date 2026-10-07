export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      service: "SLSEA Solar Generation API",
      version: "1.0.0",
      timestamp: new Date().toISOString()
    }
  });
};