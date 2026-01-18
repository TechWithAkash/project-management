import { Router } from "express";
import {
    addMemberToProject,
    getProjects,
    getProjectById,
    getProjectMembers,
    createProjects,
    updateProject,
    deleteProject,
    updateMemberRole,
    deleteMember

} from "../controllers/project.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { addMemberToProjectValidator, createProjectValidator } from "../validators/index.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { AvailableUserRole, userRolesEnum } from "../utils/constants.js";

const router = Router()
router.use(verifyJWT)

router
    .route("/")
    .get(getProject)
    .post(createProjectValidator(), validate, createProjects)

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUserRole),
        getProjectById)
    .put(
        validateProjectPermission([userRolesEnum.ADMIN]),
        createProjectValidator(),
        validate,
        updateProject
    )
    .delete(
        validateProjectPermission([userRolesEnum.ADMIN]),
        deleteProject
    )

router
    .route("/:projectId/members")
    .get(getProjectMembers)
    .post(
        validateProjectPermission([userRolesEnum.ADMIN]),
        addMemberToProject,
        validate,
        addMemberToProject,
    )


router
    .route("/:projectId/members/:userId")
    .put(
        validateProjectPermission([userRolesEnum.ADMIN]),
        updateMemberRole)
    .delete(validateProjectPermission([userRolesEnum.ADMIN]),
        deleteMember)




export default router;