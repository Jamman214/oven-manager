import { z } from "zod"

const boxSchema = z.array(z.object({
    max: z.number().min(0),
    min: z.number().min(0),
    start: z.number().min(0).transform(t => t*1000),
    end: z.number().min(0).transform(t => t*1000)
})).refine(data => {
    for (let box of data) {
        if (box.max <= box.min) return false;
        if (box.end <= box.start) return false;
    }
    return true;
})

const historyDataSchema = z.object({
    temperature: 
        z.array(z.object({
            time: z.number().min(0).transform(t => t*1000),
            core: z.number(),
            oven: z.number()
        })),
    limit: z.object({
        core: boxSchema,
        oven: boxSchema
    })
})

export {historyDataSchema}