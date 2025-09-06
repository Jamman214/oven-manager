import { useState } from "react"
import {
    useFormContext,
} from "react-hook-form";

import { type SubmitAction } from "../../components/SubmitButton.tsx";

import { ErrorAlert } from "../../components/ErrorAlert.tsx";
import { SubmitButton } from "../../components/SubmitButton.tsx";
import { FloatingInput } from "../../components/FloatingInput.tsx";

import {
    formSchema,
    apiSchema,
    initialFormValues,
    toApi,
    fromApi,
    type FormInput,

    limits,
    sectors,
    type Sector,
    type Limit
} from "../../../validation/preset/atomicPreset.tsx"

import CreateOrEdit from "./CreateOrEdit.tsx";

import "../../scss/pages/preset/AtomicPreset.scss"

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
        formState: { errors, touchedFields },
    } = useFormContext<FormInput>();

    const path = `temperature.${sector}.${limit}` as const;

    const touched = touchedFields.temperature?.[sector]?.[limit];
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
                {...register(path, {valueAsNumber: false, onBlur})}
                placeholder=" "
            />
        </FloatingInput>
        <ErrorAlert 
            error={touched && fieldError?.message}
        />
    </>;
}


function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function SectorFieldGroup({sector,}: {sector: Sector;}) {
    const {
        formState: { errors },
    } = useFormContext<FormInput>();

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

interface FormProps {
    submitAction: SubmitAction;
}

function AtomicPresetForm({submitAction}: FormProps) {
    return <>
        {sectors.map((sector, i) => (
            <SectorFieldGroup
                key={i}
                sector={sector}
            />
        ))}

        <div className="formButtons">
            <SubmitButton action={submitAction} text={{ resetText: "Save Preset" }} />
        </div>
    </>
}

function AtomicPreset() {
    const [submitAction, setSubmitAction] = useState<SubmitAction>("SUBMIT");

    return (
        <CreateOrEdit
            legendText="Schedule"
            formSchema={formSchema}
            apiSchema={apiSchema}
            initialFormValues={initialFormValues}
            namesRoute="/api/get/presets/atomic"
            dataRoute="/api/get/preset/atomic"
            editRoute="/api/edit/preset/atomic"
            createRoute="/api/create/preset/atomic"
            toApi={toApi}
            fromApi={fromApi}
            setSubmitAction={setSubmitAction}
        >
            <AtomicPresetForm submitAction={submitAction}/>
        </CreateOrEdit>
    );
}

export default AtomicPreset;
