import {useState, useRef, useMemo, useEffect} from "react"
import {
    useForm,
    FormProvider,
    useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {z} from "zod";

import ErrorAlert from "../../components/ErrorAlert.tsx";
import {type SubmitAction, SubmitButton} from "../../components/SubmitButton.tsx";
import {FloatingInput} from "../../components/FloatingInput.tsx";
import {EditableDropdown} from "../../components/EditableDropdown.tsx";
import {EditableNameDropdown, type ClickHandler} from "../../components/EditableNameDropdown.tsx";


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

import {useGetJson} from "../../hooks/useGetJSON.tsx";
import {usePostJson} from "../../hooks/usePostJSON.tsx";
import {useUpdateWhenEqual} from "../../hooks/useUpdateWhenEqual.tsx"

import "../../scss/pages/create/Preset.scss"

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

// ------------------------------------------------------------
// Name
// ------------------------------------------------------------

function usePresetData (presetID: string, modifiedCount: number) {
    const [_presetData, isPresetDataLoading, presetDataError] = useGetJson(
        "/api/get/preset",
        formSchemas.received,
        {
            requirements: () => presetID !== "",
            dependencies: [presetID, modifiedCount]
        },
        {id: presetID}
    )

    const [presetData, setPresetData] = useState<
        z.infer<typeof formSchemas.received>
        | typeof initialFormValues
    >(initialFormValues)

    useEffect(() => {
        if (isPresetDataLoading || presetDataError) return;
        setPresetData(_presetData || initialFormValues)
    }, [_presetData])

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



function PresetCreate() {
    const [validationMode, setValidationMode] = useState<ValidationMode>("unsubmitted");
    const [submitData, setSubmitData] = useState<SubmittableFormData | null>(null)

    const validationEvent = useRef<React.BaseSyntheticEvent | undefined>(undefined);
    
    const { ...methods } = useForm<FormSchemaInput, unknown, FormSchemaOutput>({
        resolver: zodResolver(
            formSchemas[validationMode]
        ),
        mode: "onBlur",
        defaultValues: initialFormValues,
    });

    const { handleSubmit, reset, watch, setValue } = methods;


    const submitAction = useSubmitData(submitData)
    const modifiedCount = useUpdateWhenEqual(submitAction, "SUCCEED") // Save or edit

    // ID of current preset
    const _presetID = watch("id");
    const presetID = _presetID === null ? "" : "" + _presetID;

    const presetData = usePresetData(presetID, modifiedCount);

    // Reset form values when a preset is selected
    const onClick = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>, 
        {value}: {value: string}
    ) => {
        setValidationMode("unsubmitted");
        if (value === presetID) {
            reset(presetData);
        } else {
            setValue("id", value === "" ? null : parseInt(value));
        }
    }

    useEffect(() => {
        reset(presetData); // Resets form once loaded
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
    }, [modifiedCount])

    // ------------------------------------------------------------
    // Form submission
    // ------------------------------------------------------------

    const submitHandler = async (data: FormSchemaOutput) => {
        // Only reached when validationMode = "submitted"
        setSubmitData(data as SubmittableFormData);
    }

    const submitFunc = (e?: React.BaseSyntheticEvent) => {
        e?.preventDefault();
        if (validationMode === "submitted") {
            handleSubmit(submitHandler)(e);
            return;
        }
        validationEvent.current = e;
        setValidationMode("submitted");
    }

    useEffect(() => {
        // Can't handle the submit until a rerender has updated the zodresolver
        if (validationMode === "submitted") {
            handleSubmit(submitHandler)(validationEvent.current);
            return;
        }
    }, [validationMode])
    
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
                        modifiedCount={modifiedCount}
                        onClick={onClick}
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

export default PresetCreate;
