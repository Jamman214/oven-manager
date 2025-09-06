import { useEffect, useState, useMemo, useRef, type ReactNode } from "react";
import { 
    useForm, 
    FormProvider, 
    type DefaultValues, 
    type Path,
    type FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"

import { usePostJson } from "../../hooks/usePostJSON.tsx";
import { useGetJson } from "../../hooks/useGetJSON.tsx";
import { useUpdateWhenEqual } from "../../hooks/useUpdateWhenEqual.tsx"

import { EditableNameDropdown } from "../../components/EditableNameDropdown.tsx";
import { type SubmitAction } from "../../components/SubmitButton.tsx";

import { requiredFormFields, requiredApiFields } from "../../../validation/create/createOrEdit.tsx";

type MinimalFormInput = z.input<typeof requiredFormFields>
type MinimalFormOutput = z.infer<typeof requiredFormFields>

type MinimalApiInput = z.input<typeof requiredApiFields>
type MinimalApiOutput = z.infer<typeof requiredApiFields>

// ------------------------------------------------------------
// Rest of the form
// ------------------------------------------------------------

function useData<
    FormInput extends MinimalFormInput,
    ApiInput extends MinimalApiInput,
    ApiOutput extends MinimalApiOutput
> (
    id: string, 
    modifiedCount: number, 
    route: string, 
    apiSchema: z.ZodType<ApiOutput, ApiInput>,
    initialFormValues: FormInput,
    fromApi: (data: ApiOutput) => FormInput
) {
    const [data, _isDataLoading, _dataError] = useGetJson<ApiOutput>(
        route,
        apiSchema,
        {
            requirements: () => id !== "",
            dependencies: [id, modifiedCount, route, apiSchema]
        },
        { id }
    )

    const [returnData, setReturnData] = useState(initialFormValues)

    const transformedData = useMemo(() => data ? fromApi(data) : null, [data]);

    useEffect(() => {
        if (id === "") setReturnData(initialFormValues);
    }, [id])

    useEffect(() => {
        transformedData && setReturnData(transformedData)
    }, [transformedData])

    return returnData;
}

function useSubmitData<
    ApiInput extends MinimalApiInput,
> (
    submitData: ApiInput | null,
    editRoute: string,
    createRoute: string

) {
    let submitRoute: string = "";
    if (submitData) {
        submitRoute = submitData.id ? editRoute : createRoute;
    }

    const [data, isLoading, error] = usePostJson(
        submitRoute,
        submitData,
        {
            requirements: () => (submitData !== null),
            dependencies: [submitData, submitRoute]
        }
    )

    return (
        isLoading ? "SUBMIT"
        : data ? "SUCCEED"
        : error ? "FAIL"
        : "RESET"
    )
}

// Used to widen path type with generics
const widenPath = <
  BaseType extends FieldValues,
  WholeType extends BaseType,
>(
  path: Path<BaseType>
): Path<WholeType> => {
  return path as Path<WholeType>;
};

interface CreateOrEditProps<FormInput, FormOutput, ApiInput, ApiOutput> {
    legendText: string;

    initialFormValues: FormInput & DefaultValues<FormInput>; // Needed for some reason?
    formSchema: z.ZodType<FormOutput, FormInput>;
    apiSchema: z.ZodType<ApiOutput, ApiInput>;

    namesRoute: string;
    dataRoute: string;
    editRoute: string;
    createRoute: string;
    
    toApi: (data: FormOutput) => ApiInput;
    fromApi: (data: ApiOutput) => FormInput;

    setSubmitAction: React.Dispatch<React.SetStateAction<SubmitAction>>

    children: ReactNode;
}

function CreateOrEdit<
    FormInput extends MinimalFormInput,
    FormOutput extends MinimalFormOutput,
    ApiInput extends MinimalApiInput,
    ApiOutput extends MinimalApiOutput
> (
    {
        legendText,
        formSchema, 
        apiSchema, 
        initialFormValues,
        namesRoute,
        dataRoute,
        editRoute, 
        createRoute,
        toApi,
        fromApi,
        setSubmitAction,
        children
    }: CreateOrEditProps<FormInput, FormOutput, ApiInput, ApiOutput>
) {
    const [submitData, setSubmitData] = useState<ApiInput | null>(null)
    
    const {...methods} = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(formSchema),
        defaultValues: initialFormValues,
        mode: "onBlur",
    });

    const {
        setValue,
        reset,
        watch,
        handleSubmit,
        formState: {isSubmitting}
    } = methods;

    const submitAction: SubmitAction = useSubmitData(submitData, editRoute, createRoute);

    useEffect(
        () => setSubmitAction?.(submitAction),
        [submitAction]
    )
    
    const editedOrSavedCount = useUpdateWhenEqual(submitAction, "SUCCEED");

    const idPath = widenPath<MinimalFormInput, FormInput>("id")

    // ID of current preset
    const id : string = watch(idPath);

    const data = useData(id, editedOrSavedCount, dataRoute, apiSchema, initialFormValues, fromApi);

    // Reset form values when a preset is selected
    const selectHandler = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>, 
        {value: newId}: {value: string}
    ) => {
        if (newId === id) {
            reset(data);
        } else {
            setValue(idPath, newId as any);
        }
    }

    useEffect(() => {
        // Resets form once fetched
        reset(data);
    }, [data])

    useEffect(() => {
        // Blurs selected input and resets form when submitting new schema
        if (submitData && submitData.id === undefined) {
            const activeElement = document.activeElement
            if (activeElement instanceof HTMLInputElement) {
                activeElement.blur()
            }
            reset(initialFormValues)
        }
    }, [editedOrSavedCount])

    const submitFunc = (formOutput: FormOutput) => setSubmitData(toApi(formOutput))

    // ------------------------------------------------------------
    // JSX
    // ------------------------------------------------------------

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(submitFunc)} noValidate>
                <fieldset {...{disabled: submitAction === "SUBMIT"}}>
                    <fieldset>
                        <legend className="group-label">{legendText}</legend>
                        <EditableNameDropdown 
                            namesRoute={namesRoute}
                            refreshOnChange={editedOrSavedCount}
                            selectHandler={selectHandler}
                        />
                    </fieldset>
                    { children }
                </fieldset>
            </form>
        </FormProvider>
    );
}

export default CreateOrEdit;
