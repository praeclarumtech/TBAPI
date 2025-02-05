export const errorHandlerMiddleware = (err, req, res, next) => {
    if (err && err.error && err.error.isJoi) {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            details: err.error.details.map(detail => detail.message),
        });
    }
    // console.error(err);
    // res.status(500).json({ success: false, message: "Internal Server Error" });
    next(err);
}