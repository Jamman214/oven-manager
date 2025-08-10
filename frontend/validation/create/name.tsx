import {z} from "zod"

const validationModes = ["submitted", "unsubmitted", "received"] as const;
type ValidationMode = (typeof validationModes)[number];

// ------------------------------------------------------------
// Schema for id
// ------------------------------------------------------------

const buildIdSchemas = () => {
    const receiveSchema = z.number().min(1);
    const sendSchema = receiveSchema.nullable();
    return {
        submitted: sendSchema,
        unsubmitted: sendSchema,
        received: receiveSchema
    }
}

const idSchemas = buildIdSchemas();

// ------------------------------------------------------------
// Schema for name
// ------------------------------------------------------------

const buildNameSchemas = () => {
    const strictSchema = z
        .string({
            invalid_type_error: "Must enter a name",
        })
        .min(1, "Must enter a name");
    const relaxedSchema = strictSchema.nullable();
    return {
        submitted: strictSchema,
        unsubmitted: relaxedSchema,
        received: strictSchema
    }
}
const nameSchemas = buildNameSchemas()

export {idSchemas, nameSchemas, type ValidationMode}