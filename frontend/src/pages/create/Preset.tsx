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
// Name
// ------------------------------------------------------------

interface NameFieldProps {
    resetValidationMode: () => void;
    modifiedCount: number;
}

// Fetches the list of presets whenever a preset is saved/edited
function usePresets(modifiedCount: number) {
    const [presets, isPresetsLoading, presetsError] = useGetJson(
        "/api/get/presets",
        z.array(z.object({
            "id": z.number(),
            "name": z.string()
        })),
        {dependencies:[modifiedCount]}
    )
    return useMemo(
        () => presets || [],
        [presets]
    )
}

// Fetches the values for the current preset whenever a new preset is selected, 
// or when a preset is saved/edited
function usePresetData (presetID: string, modifiedCount: number) {
    const [presetData, isPresetDataLoading, presetDataError] = useGetJson(
        "/api/get/preset",
        formSchemas.received,
        {
            requirements: () => presetID !== "",
            dependencies: [presetID, modifiedCount]
        },
        {id: presetID}
    )

    if (presetID === "") {
        return initialFormValues;
    }
    // Will default to new if not loading
    return presetData || initialFormValues 
}

function NameField({resetValidationMode, modifiedCount}: NameFieldProps) {
    const {
        reset,
        formState: { errors },
        register,
    } = useFormContext<FormSchemaInput, unknown, FormSchemaOutput>();

    // list of available presets
    const presets = usePresets(modifiedCount);

    // ID of current preset
    const [presetID, setPresetID] = useState("");

    // default values for current preset
    const presetData = usePresetData(presetID, modifiedCount);

    // Reset form values when a preset is selected
    const onClick = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>, 
        {value}: {value: string}
    ) => {
        resetValidationMode();
        if (value === presetID) {
            reset(presetData);
        } else {
            setPresetID(value);
        }
    }

    useEffect(() => {
        if (presetID === "") presetData && reset(presetData);
        presetData && reset(presetData); // Resets form once loaded
    }, [presetData])

    return (
        <>
            <FloatingInput
                text="Name"
                htmlFor="name"
            >
                <EditableDropdown 
                    inputProps={{id:"name", placeholder:" ", ...register("name")}}
                    valueProps={{
                        ...register(
                            "id", 
                            {setValueAs: (value) => (value==="") ? null : parseInt(value)}
                        )
                    }}
                    itemProps={{onClick}}
                    defaultItem={{value:"", text:"new", editText:""}}
                    items={
                        (presets).map((preset) => ({
                            value: "" + preset.id, 
                            text: preset.name, 
                            editText: preset.name
                        }))
                    }
                />
            </FloatingInput>
            <ErrorAlert 
                error={errors?.name?.message}
            />
            <ErrorAlert 
                error={errors?.id?.message}
            />
        </>
    );
}

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

function PresetCreate() {
    const [validationMode, setValidationMode] = useState<ValidationMode>("unsubmitted");
    const validationEvent = useRef<React.BaseSyntheticEvent | undefined>(undefined);
    
    const { ...methods } = useForm<FormSchemaInput, unknown, FormSchemaOutput>({
        resolver: zodResolver(
            formSchemas[validationMode]
        ),
        mode: "onBlur",
        defaultValues: initialFormValues,
    });

    const { handleSubmit, reset } = methods;

    const [submitData, setSubmitData] = useState<SubmittableFormData | null>(null)

    const submitRoute = submitData
        ? ( 
            (submitData.id === null)
            ? "/api/create/preset"
            : "/api/edit/preset"
        )
        : ""

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

    const submitAction: SubmitAction = (
        isLoading ? "SUBMIT"
        : data ? "SUCCEED"
        : error ? "FAIL"
        : "RESET"
    )

    const modifiedCount = useUpdateWhenEqual(submitAction, "SUCCEED") // Save or edit

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

    const submitHandler = async (data: FormSchemaOutput) => {
        // Only reached when validationMode = "submitted"
        setSubmitData(data as SubmittableFormData);
    }

    const submitFunc = (e?: React.BaseSyntheticEvent) => {
        e?.preventDefault();
        validationEvent.current = e;
        if (validationMode === "submitted") {
            handleSubmit(submitHandler)(e);
            return;
        } else {
            setValidationMode("submitted");
        }
    }

    useEffect(() => {
        // Can't handle the submit until a rerender has updated the zodresolver
        if (validationMode === "submitted") {
            handleSubmit(submitHandler)(validationEvent.current);
            return;
        }
    }, [validationMode])
    
    return (
        <FormProvider {...methods}>
            <form onSubmit={submitFunc} noValidate>
                <fieldset>
                    <legend className="group-label">Preset</legend>
                    <NameField 
                        resetValidationMode={() => {setValidationMode("unsubmitted")}}
                        modifiedCount={modifiedCount}
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
