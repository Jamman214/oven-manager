import { useEffect, useReducer, type DependencyList } from "react"

type FetchInit = RequestInit
type ResponseHandler<T> = ((response: Response) => Promise<T>) | ((response: Response) => T);

const toError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }

  let errorString = "<No String Representation>";
  try {
    errorString = JSON.stringify(value);
  } catch {}

  return new Error(`Non-Error thrown:" ${errorString}`);
};

interface FetchState<T> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
}

type SetErrorAction = {type: "setError", error: Error}
type SetDataAction<T> = {type: "setData", data: T}
type SetIsLoadingAction = {type: "setIsLoading", isLoading: boolean}
type NewFetchAction = {type: "newFetch"}

type FetchAction<T> = 
    | SetErrorAction
    | SetDataAction<T> 
    | SetIsLoadingAction
    | NewFetchAction

type DataCompiler<T> = (prev: T | null, next: T | null) => T | null

function useSafeFetch<T>(
    input: RequestInfo | URL,
    {
        init, 
        okResponseHandler, 
        dependencies = [], 
        requirements, 
        dataCompiler = (prev, next) => next,
        resetDataOnFetch = false
    } : {
        init?: Omit<FetchInit, "signal">,
        okResponseHandler?: ResponseHandler<T>,
        requirements?: () => boolean,
        dependencies?: DependencyList,
        dataCompiler?: DataCompiler<T>,
        resetDataOnFetch?: boolean
        
    }
) {

    // Setup useReducer hook
    const reducer = (state: FetchState<T>, action: FetchAction<T>) => {
        switch (action.type) {
            case "setData":
                return {
                    ...state, 
                    data: dataCompiler(state.data, action.data), 
                    isLoading: false
                };
            case "setError":
                return {...state, error: action.error, isLoading: false};
            case "setIsLoading":
                return {...state, isLoading: action.isLoading};
            case "newFetch":
                return {
                    ...state, 
                    data: (resetDataOnFetch ? null : state.data), 
                    isLoading: true, 
                    error: null
                };
            default:
                return state;
        }
    }
    const inital: FetchState<T> = {data: null, isLoading: false, error: null}
    const [state, dispatch] = useReducer(reducer, inital);

    useEffect(() => {
        if (requirements && !requirements?.()) return;
        dispatch({type: "newFetch"});

        const controller = new AbortController();
        const signal = controller.signal;

        const runFetch = async () => {
            try {
                const response = await fetch(input, {...init, signal});
                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`)
                }

                if (!okResponseHandler) {
                    // Doesnt do anything with response
                    dispatch({type: "setIsLoading", isLoading: false});
                    return;
                }

                const data = await okResponseHandler(response);
                dispatch({type: "setData", data});

            } catch (unknownThrown) {
                const error = toError(unknownThrown);
                if (error.name === "AbortError") return;
                dispatch({type: "setError", error});
            }
        };
        runFetch();
        
        return () => {
            controller.abort();
        }
    }, dependencies);

    return [state.data, state.isLoading, state.error] as const;
}

export {useSafeFetch, type ResponseHandler}