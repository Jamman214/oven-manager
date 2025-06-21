import {z} from "zod";

// const allowEmpty = <T extends z.ZodType>(schema: T) => {
//     return z.preprocess(
//         (val => val=="" ? null : val),
//         z.nullable(schema)
//     )
// }

const allowEmpty = <T extends z.ZodType>(schema: T) => {
    return z.union([schema, z.literal("")]);
}

const captureEmpty = <T extends z.ZodType>(schema: T) => {
    return z.preprocess(
        (val) => val == "" ? null : val,
        z.nullable(schema)
    )
}

export {allowEmpty, captureEmpty};