import { User } from "../models/user.models.js"
import { Project } from "../models/project.models.js"
import { ProjectMember } from "../models/projectmembers.models.js"
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableUserRole, userRolesEnum } from "../utils/constants.js";

const createProjects = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    })

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: userRolesEnum.ADMIN
    })

    return res
        .status(201)
        .json(new ApiResponse(201, project, "Project Created Successfully"))


})

const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    const { projectId } = req.params

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description
        },
        { new: true }
    )

    if (!project) {
        throw new ApiError(404, "Project Not Found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project Updated Sucessfully"))
})

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const project = await Project.findByIdAndDelete({
        projectId
    })

    if (!project) {
        throw new ApiError(404, "Project Not Found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project Deleted Successfully"))
})

const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([
        {
            // Pipeline 1: Its used to match our data its like the where clause in the SQL
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        // Pipeline 2: In lookup we basically looking the data we wwant to get that;s all
        {
            $lookup: {
                from: "projects",
                localField: "projects",
                foreignField: "_id",
                as: "projects",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "projects",
                            as: "projectmembers",
                        },
                    },
                    {
                        $addFields: {
                            members: {
                                $size: "$projectmembers"
                            }
                        }
                    }
                ]
            },
        },

        //  Pipeline 3: Unwind the Project i.e collecting the projects
        {
            $unwind: "$project"
        },

        // Pipiline : Here we are collecting data the projects

        {
            $project: {
                project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    members: 1,
                    createdAt: 1,
                    createdBy: 1
                },
                role: 1,
                _id: 0
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200), projects, "Project Fetched Successfully")
})

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const project = await Project.findById(projectId)

    if (!project) {
        throw new ApiError(404, "Project not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, project, "Project fetched Successfully")
        )

})


const addMemberToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body
    const { projectId } = req.params
    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    await ProjectMember.findByIdAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role
        },
        {
            new: true,
            upsert: true
        }
    )

    return res.status(201).json(201, {}, "Project member added Successfully")
})

const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params
    const project = await Project.findById(req.params)
    if (!project) {
        throw new ApiError(404, "Project not Found")
    }

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },

        {
            $addFields: {
                user: {
                    $arrayElemAt: ["$user", 0]
                }
            }
        },
        {
            $project: {
                project: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0
            }
        }

    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, projectMembers, "ProjectMembers Fetched Successfully")
        )
})

const updateMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params
    const { newRole } = req.body

    if (!AvailableUserRole.includes(newRole)) {
        throw new ApiError(404, "Invalid Role")
    }

    const projectMembers = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })

    if (!projectMembers) {
        throw new ApiError(400, "Project Member not found")
    }

    const projectMember = await ProjectMember.findByIdAndUpdate(
        projectMember._id,
        {
            role: newRole
        },
        { new: true }
    )


    if (!projectMember) {
        throw new ApiError(400, "Project Member not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, projectMember, "Project Member  role Updated Successfully"))

})

const deleteMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params

    const projectMembers = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId)
    })

    if (!projectMembers) {
        throw new ApiError(400, "Project Member not found")
    }

    const projectMember = await ProjectMember.findByIdAndDelete(
        projectMember._id,
    )


    if (!projectMember) {
        throw new ApiError(400, "Project Member not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, projectMember, "Project Member  Deleted Successfully"))
})

export {
    addMemberToProject,
    getProjects,
    getProjectById,
    getProjectMembers,
    createProjects,
    updateProject,
    deleteProject,
    updateMemberRole,
    deleteMember
}