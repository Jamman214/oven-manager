import {useState} from "react"
import {
    useForm,
    FormProvider,
    useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import ErrorAlert from "../../components/ErrorAlert.tsx";
import {type SubmitAction, SubmitButton} from "../../components/SubmitButton.tsx";

import {
    formSchema, 
    isFormSubmittable, 
    type FormInput, 
    type FormOutput, 
    type SubmittableForm, 
    type FormData,
    sectors, 
    type Sector, 
    limits, 
    type Limit
} from "../../../validation/create/preset.tsx"

import {usePostJson} from "../../hooks/usePostJSON.tsx";

function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
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

    const path = `form.${sector}.${limit}` as const;

    const isInvalid = Boolean(
        errors.form?.[sector]?.[limit]?.message
        || errors.form?.[sector]?.message
        || errors.form?.message
    )


    const onBlur = async () => {await trigger()};
    // const onBlur = () => {}
    
    return (
        <>
            <label>{capitalise(limit)}</label>
            <input
                type="number"
                {...register(
                    path, 
                    {
                        valueAsNumber: true,
                        onBlur
                    }
                )}
                placeholder=" "
            />
            <ErrorAlert error={errors.form?.[sector]?.[limit]?.message}/>
        </>
    );
}

function SectorFieldGroup({sector,}: {sector: Sector;}) {
    const {
        formState: { errors },
    } = useFormContext<FormInput, unknown, FormOutput>();

    const fieldError = errors.form?.[sector];

    return (
        <>
    
            <label>{capitalise(sector)} Temperature</label>
            {limits.map((limit, i) => (
                
                    <TemperatureField
                        sector={sector}
                        limit={limit}
                    />
            ))}
            <ErrorAlert 
                error={fieldError?.message}
            />
            {
                sector === 'oven' &&
                <ErrorAlert 
                    error={errors?.form?.message}
                />
            }
        </>
    );
}

function FormFields() {
    const {
        formState: { errors },
    } = useFormContext<FormInput, unknown, FormOutput>();

    return (
        <>
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
    const { ...methods } = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(formSchema),
        mode: "onSubmit",
        defaultValues: {
            form: {
                core: {
                    high: null,
                    low: null
                },
                oven: {
                    high: null,
                    low: null
                }
            }
        }
    });

    const { handleSubmit, setError, setValue } = methods;

    const [submitData, setSubmitData] = useState<FormData<SubmittableForm> | null>(null)


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

    // Produce error and remove default null value from any null fields
    const showNullError = (data: FormOutput, sector: Sector, limit: Limit) => {
        if (data.form?.[sector][limit] !== null) return;
        const path = `form.${sector}.${limit}` as const;
        setError(path, { type: "custom", message: "Must enter a number" });
    }

    const showNullErrors = (data: FormOutput) => {
        for (let sector of sectors) {
            for (let limit of limits) {
                showNullError(data, sector, limit);
            }
        }
    }

    const submitHandler = async (data: FormOutput) => {
        if (isFormSubmittable(data)) {
            setSubmitData(data.form);
            return;
        }
        showNullErrors(data);
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(submitHandler)} noValidate>
                <FormFields/>
                <SubmitButton action={submitAction} text={{ resetText: "Save Preset" }} />
            </form>
        </FormProvider>
    );
}

export default PresetCreate;
