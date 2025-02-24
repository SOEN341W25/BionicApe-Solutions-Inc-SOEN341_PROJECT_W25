import jwt from "jsonwebtoken";

export const generateToken = (userID, res) => {
    const token = jwt.sign({ userID }, "mysecretkey", { expiresIn: "7d" });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true, // Prevents XSS (Cross-Site Scripting) attacks
        sameSite: "strict", // Helps mitigate CSRF (Cross-Site Request Forgery) attacks
        secure: process.env.NODE_ENV === "production", // Only secure in production
    });

    return token; // Optional: Return token for debugging
};
