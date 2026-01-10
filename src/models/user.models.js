import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import crypto from "crypto"
const userSchema = new Schema(

    {
        avatar: {
            type: {
                url: String,
                localPath: String
            },
            default: {
                url: ``,
                localPath: ""
            }
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is Required"]
        },
        isEmailedVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String
        },
        forgotPasswordToken: {
            type: String
        },
        forgortPasswordExpiry: {
            type: Date
        },
        emailVerificationToken: {
            type: String
        },
        emailVerificationExpiry: {
            type: Date
        }
    }, {
    timestamps: true,
}
)

// PreHook to Hash The password
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next;

    this.password = await bcrypt.hash(this.password, 10);
    next;
})

// Created a Method to Whether the Match the Password is Correct or not
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
};

// Method to Generate to Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )

};


// Generate the RefreshToken
userSchema.methods.generateRefreshToken = function () {
    jwt.sign(
        {
            // payload
            _id: this._id,
        },
        // Secret
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

// Temporary Token : Useful to validate the login and signin user
userSchema.methods.generateTemporaryToken = function (){
    const unHashedToken = crypto.randomBytes(20).toString("hex")

    const hashedToken = crypto
                        .createHash("sha256")
                        .update(unHashedToken)
                        .digest("hex")
    const tokenExpiry = Date.now() + (20*60*1000) // Expired in 20 minutes
    return { unHashedToken, hashedToken, tokenExpiry}

}

export const User = mongoose.model("User", userSchema);