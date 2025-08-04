import {useState, useRef, useMemo, useEffect} from "react"
import {
    useForm,
    FormProvider,
    useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import {useGetJson} from "../../hooks/useGetJSON.tsx";
import {usePostJson} from "../../hooks/usePostJSON.tsx";

import "../../scss/pages/create/Preset.scss"

function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

interface NameFieldProps {
    onReset: () => void;
}

function NameField({onReset}: NameFieldProps) {
    const {
        reset,
        formState: { errors },
        register
    } = useFormContext<FormInput, unknown, FormOutput>();

    const [value, setValue] = useState("");
    const [counter, setCounter] = useState(0);

    const [data, isLoading, error] = useGetJson(
        "/api/create/preset",
        formSchema("submitted"),
        {
            requirements: () => value !== "",
            dependencies: [counter]
        }
    )
    
    useEffect(() => {
        if (value === "") {
            reset({
                name: "",
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
            })
        }
    }, [counter])



    const onClick = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>, 
        {value, editText}: {value: string, editText: string}
    ) => {
        onReset();
        reset({
            name: editText,
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
        })
    }

    return (
        <>
            <FloatingInput
                text="Name"
                htmlFor="name"
            >
                <EditableDropdown 
                    inputProps={{id:"name", placeholder:" ", ...register("name")}}
                    itemProps={{onClick}}
                    defaultItem={{value:"", text:"new", editText:""}}
                    items={[{value:"1", text:"item1", editText:"item1"}]}
                />
            </FloatingInput>
            <ErrorAlert 
                error={errors?.name?.message}
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

interface FormFieldsProps {
    onReset: () => void;
}


function FormFields({onReset}: FormFieldsProps) {
    const {
        formState: { errors },
        register
    } = useFormContext<FormInput, unknown, FormOutput>();

    return (
        <>
            <fieldset>
                <legend className="group-label">Preset</legend>
                <NameField onReset={onReset}/>
            </fieldset>
            {sectors.map((sector, i) => (
                <SectorFieldGroup
                    key={i}
                    sector={sector}
                />
            ))}
        </>
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


    const [data, isLoading, error] = usePostJson(
        "/api/create/preset",
        submitData,
        {
            requirements: () => submitData !== null,
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
                <FormFields onReset={() => {setValidationMode("unsubmitted")}}/>
                <SubmitButton action={submitAction} text={{ resetText: "Save Preset" }} />
            </form>
        </FormProvider>
    );
}

export default PresetCreate;
