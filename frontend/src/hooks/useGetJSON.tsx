import {useSafeFetch} from "./useSafeFetch.tsx"
import {type DependencyList} from "react"
import {z} from "zod"

function useGetJson<T>(
    route: string, 
    schema: z.ZodType<T>, 
    options: {
        requirements?: () => boolean,
        dependencies: DependencyList
    } = {
        dependencies: []
    }
) {
    return useSafeFetch<T>(
        route,
        {
            init: {
                method: "GET",
            },
            okResponseHandler: async (response) => {
                const unknownJson = await response.json()
                const knownJson = schema.parse(unknownJson)
                return knownJson
            },
            ...options
        }
    );
}

export {useGetJson}