import { body } from "express-validator";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is Required")
            .isEmail()
            .withMessage("Email is invalid"),

        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLowercase()
            .withMessage("Username must be in lowerCase")
            .isLength({ min: 3 })
            .withMessage("Usename must be at least 3 character long"),

        body("password")
            .trim()
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6 })
            .withMessage("Password Must be atleast 6 Character long"),

        body("fullName")
            .trim()
            .optional()
    ]
}


export {
    userRegisterValidator
}