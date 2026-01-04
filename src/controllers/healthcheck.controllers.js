import { ApiResponse } from "../utils/api-response.js"
import { asyncHandler } from "../utils/async-handler.js";

/*
const healthCheck = async (req, res, next) => {
    const user = await UserDataFromDB()
    try {
        res
            .status(200)
            .json(new ApiResponse(200, { message: "Server is Running" }))

    } catch (error) {
        next(err)
    }
}
*/

const healthCheck = asyncHandler(async (req, res) => {
    res
        .status(200)
        .json(new ApiResponse(200, { message: "Server is Running" }))
})
export default healthCheck;