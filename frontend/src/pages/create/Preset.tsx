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
    formSchema, 
    isFormSubmittable, 
    type FormInput, 
    type FormOutput, 
    type SubmittableForm, 
    type ValidationMode,
    sectors, 
    type Sector, 
    limits, 
    type Limit
} from "../../../validation/create/preset.tsx"

import {useGetJson, type GetJsonOutput} from "../../hooks/useGetJSON.tsx";
import {usePostJson} from "../../hooks/usePostJSON.tsx";

import "../../scss/pages/create/Preset.scss"

function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

interface NameFieldProps {
    resetValidationMode: () => void;
}

function usePresets() {
    return useGetJson(
        "/api/get/presets",
        z.array(z.object({
            "id": z.number(),
            "name": z.string()
        })),
        {dependencies:[]}
    )
}

function usePresetData (presetID: string) {
    const defaultOutput = useMemo(() => 
        [
            {
                "id": null,
                "name": "",
                "temperatures": {
                    "core": {"high": null, "low": null}, 
                    "oven": {"high": null, "low": null}
                }
            },
            false,
            null
        ] as const, 
        []
    )

    const getJsonOutput = useGetJson(
        "/api/get/preset",
        z.object({
            "id": z.number(),
            "name": z.string(),
            "temperatures": z.object({
                "core": z.object({
                    "high": z.number(),
                    "low": z.number()
                }),
                "oven": z.object({
                    "high": z.number(),
                    "low": z.number()
                })
            })
        }),
        {
            requirements: () => presetID !== "",
            dependencies: [presetID]
        },
        {id: presetID}
    )

    if (presetID === "") {
        return defaultOutput;
    }
    return getJsonOutput
}

function NameField({resetValidationMode}: NameFieldProps) {
    const {
        reset,
        formState: { errors },
        register,
        getValues
    } = useFormContext<FormInput, unknown, FormOutput>();

    console.log(getValues())

    // Fetch current preset names and ids when first mounted
    const [presets, isPresetsLoading, presetsError] = usePresets();

    // ID of preset currently bring edited
    const [presetID, setPresetID] = useState("");

    // temperatures to reset preset to
    const [presetData, isPresetDataLoading, presetDataError] = usePresetData(presetID);

    // Reset form values when a preset is selected
    const onClick = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>, 
        {value}: {value: string}
    ) => {
        resetValidationMode();
        // setValue("id", (value==="") ? null : parseInt(value))
        setPresetID(value);
    }

    useEffect(() => {
        presetData && reset(presetData);
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
                        (presets || []).map((preset) => ({
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
    } = useFormContext<FormInput, unknown, FormOutput>();

    const path = `temperatures.${sector}.${limit}` as const;

    const isInvalid = Boolean(
        errors.temperatures?.[sector]?.[limit]?.message
        || errors.temperatures?.[sector]?.message
        || errors.temperatures?.message
    )

    const fieldError = errors.temperatures?.[sector]?.[limit];


    const onBlur = async () => {
        await trigger("temperatures")
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

function SectorFieldGroup({sector,}: {sector: Sector;}) {
    const {
        formState: { errors },
    } = useFormContext<FormInput, unknown, FormOutput>();

    const fieldError = errors.temperatures?.[sector];

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
                    error={errors?.temperatures?.message}
                />
            }
        </fieldset>
    );
}


function PresetCreate() {
    const [validationMode, setValidationMode] = useState<ValidationMode>("unsubmitted");
    const validationEvent = useRef<React.BaseSyntheticEvent | undefined>(undefined);
    
    const { ...methods } = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(
            formSchema(validationMode)
        ),
        mode: "onBlur",
        defaultValues: {
            id: null,
            name: null,
            temperatures: {
                core: {
                    high: null,
                    low: null
                },
                oven: {
                    high: null,
                    low: null
                }
            }
        },
    }
    );

    const { handleSubmit, setError, setValue } = methods;

    const [submitData, setSubmitData] = useState<SubmittableForm | null>(null)

    const submitRoute = submitData
        ? ( 
            (submitData.id === null)
            ? "/api/create/preset"
            : "/api/edit/preset"
        )
        : ""

    const [data, isLoading, error] = usePostJson(
        submitRoute,
        submitData,
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



    const submitHandler = async (data: FormOutput) => {
        if (isFormSubmittable(data)) {
            setSubmitData(data);
            return;
        }
    }

    const submitFunc = (e?: React.BaseSyntheticEvent) => {
        console.log(methods.getValues())
        if (validationMode === "submitted") {
            handleSubmit(submitHandler)(e);
            return;
        }
        e?.preventDefault();
        validationEvent.current = e;
        setValidationMode("submitted");
    }

    useEffect(() => {
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
