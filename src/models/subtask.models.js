import mongoose, { Schema } from "mongoose";

const subTaskSchema = new Schema({
    title: {
        type: String,
        required: true,
        trime: true
    },
    tasks: {
        type: Schema.Types.ObjectId,
        ref: "Task",
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamp: true })

export const SubTask = mongoose.model("Subtask", subTaskSchema)