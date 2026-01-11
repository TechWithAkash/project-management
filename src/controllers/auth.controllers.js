import { User } from "../models/user.models.js"
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerficationMailgenContent, forgotPasswordMailgenContent, sendEmail } from "../utils/mail.js"
import jwt from "jsonwebtoken";

// 1. Generate the AccessandRefreshToken
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

// 2. Post Method of RegisterUser
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

// 3. Get Method of LoginUser
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email) {
        throw new ApiError(400, "Username or Email is required")
    }
    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(400, "User does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid Credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"  //this things i don't want to send it
    )

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User LoggedIn Successfully"
            )
        )



})

// 4. Method Of Logout User
// secure Routes
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: "",
            },

        },
        {
            new: true,
        }
    );
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshTokne", options)
        .json(
            new ApiResponse(200, {}, "User LoggedOut Successfully!!")
        )
})

// GGet Method to get current User
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"))

})

const verifyEmail = asyncHandler(async (req, res) => {
    const { VerificationToken } = req.params
    if (!VerificationToken) {
        throw new ApiError(400, "Email Verification token is missing")
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(VerificationToken)
        .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw new ApiError(400, "Token is Invalid or Expired")
    }

    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified: true,
                },
                "Email is Verified Successfully"
            )
        )
})


const resendVerificationEmail = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }
    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified ")
    }

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

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Mail has been sent to your email id "
            )
        )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Access!!")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token!!")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        user.refreshToken = newRefreshToken
        await user.save()

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access Token Refreshed"
                )
            )


    } catch (error) {
        throw new ApiError(401, "Invalid AccessToken")
    }


})

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User does not Exists", [])
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken
    user.forgortPasswordExpiry = tokenExpiry

    await user.save({ validateBeforeSave: false })

    await sendEmail({
        email: user?.email,
        subject: "Password Reset request",
        mailgenContent: forgotPasswordMailgenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECRT_URL}/${unHashedToken}`,
        ),

    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset main has been sent to your mail id"
            )
        )


})

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params
    const { newPassword } = req.body

    let hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex")

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgortPasswordExpiry: { $gt: Date.now() }
    })

    if (!user) {
        throw new ApiError(409, "Token is Invalid or Expired")
    }

    user.forgortPasswordExpiry = undefined
    user.forgotPasswordToken = undefined

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            200, {}, "Password Reset Successfully"
        ))
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(400, "INvald Old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password Change Successfully"
            )
        )
})

export {
    registerUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendVerificationEmail,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword,
    generateAccessAndRefreshToken
};