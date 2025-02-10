export const errorHandler = (err,req,res,next)=>{
    if (err && err.error && err.error.isJoi) {
        const errorDetails = err.error.details.map(detail => detail.message);
        
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errorDetails
        });
    }
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
}
