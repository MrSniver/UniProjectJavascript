//Middleware for handling errors #dla grupy jak tworzycie odniesienie do api dodajcie next jako parametr
const errorMiddleware = (err, req, res, next) => {
    console.error("Error: ", err.message);

    res.status(err.status || 500).json({
        status: "error",
        message: err.message || "Internal Server Error",
    });
};

module.exports = errorMiddleware;