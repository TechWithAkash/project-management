import { User } from "../models/user.models.js"
import { Project } from "../models/project.models.js"
import { Task } from "../models/task.models.js"
import { Subtask } from "../models/subtask.models.js"
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableUserRole, userRolesEnum } from "../utils/constants.js";

const getTasks = asyncHandler(async (req, req) => {
    //chai
})

const createTasks = asyncHandler(async (req, req) => {
    //chai
})

const updateTasks = asyncHandler(async (req, req) => {
    //chai
})

const deleteTasks = asyncHandler(async (req, req) => {
    //chai
})

const getTasksById = asyncHandler(async (req, req) => {
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