import { User } from "../models/user.models.js"
import { Project } from "../models/project.models.js"
import { Task } from "../models/task.models.js"
import { Subtask } from "../models/subtask.models.js"
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose, { Mongoose } from "mongoose";
import { AvailableUserRole, userRolesEnum } from "../utils/constants.js";
import { pipeline } from "nodemailer/lib/xoauth2/index.js";

const getTasks = asyncHandler(async (req, req) => {
    const { projectId } = req.params
    const project = await Project.findById(projectId)
    if (!project) {
        throw new ApiError(404, "Project not Found")
    }
    const taskss = await Task.find({
        project: new mongoose.Types.ObjectId(projectId)
    }).populate("assignedTo", "avatar username fullName")

    return res
        .status(201)
        .json(201, tasks, "Task fetched Successfully")


})

const createTasks = asyncHandler(async (req, req) => {
    const { title, description, assignedTo, status } = req.body
    const { projectId } = req.params
    const project = await Project.findById(projectId)
    if (!project) {
        throw new ApiError(404, "Project Not Found")
    }
    const files = req.files || []
    files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/images/${file.originalname}`,
            mimetype: file.mimetype,
            size: file.size
        }
    })

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
        status,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments
    });

    return res
        .status(201)
        .json(201, task, "Task Created Successfully")

})

const getTasksById = asyncHandler(async (req, req) => {
    const { taskId } = req.params
    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        avatar: 1
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                },

                            ]
                        }
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $arrayElemAt: ["$createdBy", 0]
                            }
                        }
                    }
                ]
            }
        },

        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0]
                }
            }
        }
    ])

    if (!task || task.length === 0) {
        throw new ApiError(404, "Task not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, task[0], "Tasked fetched Successfullyyyy"))
})

const updateTasks = asyncHandler(async (req, req) => {
    //chai
})

const deleteTasks = asyncHandler(async (req, req) => {
    //chai
})




const createSubTask = asyncHandler(async (req, req) => {
    //chai
})

const updateSubTask = asyncHandler(async (req, req) => {
    //chai
})

const deleteSubTask = asyncHandler(async (req, req) => {
    //chai
})

export {
    getTasks,
    createTasks,
    updateSubTask,
    updateTasks,
    deleteTasks,
    deleteSubTask,
    getTasksById,
    createSubTask
}