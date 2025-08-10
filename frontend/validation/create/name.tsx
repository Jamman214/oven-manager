import {z} from "zod"

const validationModes = ["submitted", "unsubmitted", "received"] as const;
type ValidationMode = (typeof validationModes)[number];

// ------------------------------------------------------------
// Schema for id
// ------------------------------------------------------------

const simpleIdSchema = z.number().nullable()
const buildIdSchemas = () => {
    const receiveSchema = z.number().min(1);
    const sendSchema = receiveSchema.nullable();
    return {
        submitted: sendSchema,
        unsubmitted: sendSchema,
        received: receiveSchema
    } as const
}

const idSchemas = buildIdSchemas();

// ------------------------------------------------------------
// Schema for name
// ------------------------------------------------------------

const simpleNameSchema = z.string().nullable()
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
    } as const
}
const nameSchemas = buildNameSchemas()

export {idSchemas, simpleIdSchema, nameSchemas, simpleNameSchema, type ValidationMode}