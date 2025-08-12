import { useState, useEffect } from "react"
import {
    useForm,
    FormProvider,
    useFormContext,
    type Path
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from "zod";

import {useGetJson} from "../../hooks/useGetJSON.tsx";
import {usePostJson} from "../../hooks/usePostJSON.tsx";
import {useUpdateWhenEqual} from "../../hooks/useUpdateWhenEqual.tsx"

import { ErrorAlert } from "../../components/ErrorAlert.tsx";
import { SubmitButton } from "../../components/SubmitButton.tsx";
import { FloatingInput } from "../../components/FloatingInput.tsx";
import { EditableNameDropdown } from "../../components/EditableNameDropdown.tsx";

import {
    formSchemas, 
    initialFormValues,
    sectors, 
    limits, 
    
    type FormSchemaInput, 
    type FormSchemaOutput, 
    type SubmittableFormData,
    type ValidationMode,
    type Sector, 
    type Limit  
} from "../../../validation/create/preset.tsx"

import "../../scss/pages/create/CreatePreset.scss"

// ------------------------------------------------------------
// Temperatures
// ------------------------------------------------------------

function TemperatureField({
    sector,
    limit,
}: {
    sector: Sector;
    limit: Limit;
}) {
    const {
        trigger,
        register,
        formState: { errors },
    } = useFormContext<FormSchemaInput, unknown, FormSchemaOutput>();

    const path = `temperature.${sector}.${limit}` as const;

    const fieldError = errors.temperature?.[sector]?.[limit];

    const onBlur = async () => {
        await trigger("temperature")
    };
    
    return <>
        <FloatingInput
            text={limit}
            htmlFor={path}
        >
            <input 
                type="text"
                inputMode="numeric"
                {...register(path, {valueAsNumber: true, onBlur})}
                placeholder=" "
            />
        </FloatingInput>
        <ErrorAlert 
            error={fieldError?.message}
        />
    </>;
}


function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function SectorFieldGroup({sector,}: {sector: Sector;}) {
    const {
        formState: { errors },
    } = useFormContext<FormSchemaInput, unknown, FormSchemaOutput>();

    const fieldError = errors.temperature?.[sector];

    return (
        <fieldset>
            <legend className="group-label">{capitalise(sector)} Temperature</legend>
            {limits.map((limit, i) => (
                    <TemperatureField
                        sector={sector}
                        limit={limit}
                        key={i}
                    />
            ))}
            <ErrorAlert 
                error={fieldError?.message}
            />
            {
                sector === 'oven' &&
                <ErrorAlert 
                    error={errors?.temperature?.message}
                />
            }
        </fieldset>
    );
}

// ------------------------------------------------------------
// Rest of the form
// ------------------------------------------------------------

function usePresetData (presetID: number | null, modifiedCount: number) {
    const urlPresetID = presetID === null ? "" : "" + presetID
    const [_presetData, isPresetDataLoading, presetDataError] = useGetJson(
        "/api/get/preset",
        formSchemas.received,
        {
            requirements: () => presetID !== null,
            dependencies: [presetID, modifiedCount]
        },
        {id: urlPresetID}
    )

    const [presetData, setPresetData] = useState<
        z.infer<typeof formSchemas.received>
        | typeof initialFormValues
    >(initialFormValues)

    useEffect(() => {
        if (isPresetDataLoading || presetDataError) return;
        setPresetData(presetID === null ? initialFormValues : _presetData || initialFormValues)
    }, [_presetData, presetID])

    return presetData;
}

function useSubmitData (submitData: SubmittableFormData | null) {
    const submitRoute = submitData
        ? ( 
            (submitData.id === null)
            ? "/api/create/preset"
            : "/api/edit/preset"
        ) : ""

    const [data, isLoading, error] = usePostJson(
        submitRoute,
        submitData && (
            submitData.id !== null 
                ? submitData 
                : {
                    name: submitData.name,
                    temperature: submitData.temperature
                }
        ),
        {
            requirements: () => (submitData !== null),
            dependencies: [submitData]
        }
    )

    return (
        isLoading ? "SUBMIT"
        : data ? "SUCCEED"
        : error ? "FAIL"
        : "RESET"
    )
}



function CreatePreset() {
    const [validationMode, setValidationMode] = useState<ValidationMode>("unsubmitted");
    const [submitData, setSubmitData] = useState<SubmittableFormData | null>(null)
    
    const { ...methods } = useForm<FormSchemaInput, unknown, FormSchemaOutput>({
        resolver: zodResolver(
            formSchemas[validationMode]
        ),
        mode: "onBlur",
        defaultValues: initialFormValues,
    });

    const { reset, watch, setValue, getValues, setError } = methods;

    const submitAction = useSubmitData(submitData)
    const editedOrSavedCount = useUpdateWhenEqual(submitAction, "SUCCEED") // Save or edit

    // ID of current preset
    const presetID = watch("id");

    const presetData = usePresetData(presetID, editedOrSavedCount);

    // Reset form values when a preset is selected
    const nameSelectHandler = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>, 
        {value}: {value: string}
    ) => {
        const newPresetID = value === "" ? null : parseInt(value)
        setValidationMode("unsubmitted");
        if (newPresetID === presetID) {
            reset(presetData);
        } else {
            setValue("id", newPresetID);
        }
    }

    useEffect(() => {
        // Resets form once loaded
        reset(presetData);
    }, [presetData])

    useEffect(() => {
        // Blurs selected input and resets form when submitting new schema
        if (submitData && submitData.id === null) {
            const activeElement = document.activeElement
            if (activeElement instanceof HTMLInputElement) {
                activeElement.blur()
            }
            setValidationMode("unsubmitted");
            reset(initialFormValues)
        }
    }, [editedOrSavedCount])

    // ------------------------------------------------------------
    // Form submission
    // ------------------------------------------------------------
    
    const submitFunc = (
        e?: React.BaseSyntheticEvent
    ) => {
        e?.preventDefault();

        const data = getValues();
        const result = formSchemas.submitted.safeParse(data);
        if (result.success) {
            setSubmitData(result.data);
        } else {
            for (const issue of result.error.issues) {
                const path = issue.path.join(".") as Path<FormSchemaInput>;
                setError(path, {
                    type: "manual",
                    message: issue.message,
                });
            }
        }
        setValidationMode("submitted")
    }

    // ------------------------------------------------------------
    // JSX
    // ------------------------------------------------------------

    return (
        <FormProvider {...methods}>
            <form onSubmit={submitFunc} noValidate>
                <fieldset>
                    <legend className="group-label">Preset</legend>
                    <EditableNameDropdown 
                        namesRoute="/api/get/presets"
                        refreshOnChange={editedOrSavedCount}
                        selectHandler={nameSelectHandler}
                    />
                </fieldset>
                {sectors.map((sector, i) => (
                    <SectorFieldGroup
                        key={i}
                        sector={sector}
                    />
                ))}
                <SubmitButton action={submitAction} text={{ resetText: "Save Preset" }} />
            </form>
        </FormProvider>
    );
}

export default CreatePreset;
