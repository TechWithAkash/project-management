import { User } from "../models/user.models.js"
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerficationMailgenContent, sendEmail } from "../utils/mail.js"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {

        throw new ApiError(
            500,
            "Something went Wrong wwhile generating access Token"
        )

    }
}

const registerUser = asyncHandler(async (req, res) => {

    const { email, username, password, role } = req.body;
    const existedUser = await User.findOne({
        $or: [{ username }, { password }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or Username already exists", [])
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false,
    })

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false })

    await sendEmail({
        email: user?.email,
        subject: "Please Verify you're Email",
        mailgenContent: emailVerficationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/
             verify-email/${unHashedToken}`,
        ),

    })

    // Send the limited amouint of Data to the backend or database
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"  //this things i don't want to send it
    )
    if (!createdUser) {
        throw new ApiError(
            500,

            "something went wrong while registering the user"
        )
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { user: createdUser },
                "User Registered Successfully and verification email sent to you're mail"
            )
        )





})

export {
    registerUser,
    generateAccessAndRefreshToken
};