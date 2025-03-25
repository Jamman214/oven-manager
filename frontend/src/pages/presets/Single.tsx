import { useEffect, useState, useMemo } from "react";
import { number, z } from "zod";

import {
    useForm,
    UseFormWatch,
    UseFormTrigger,
    FormProvider,
    useFormContext,
    FieldError,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import {
    SubmitAction,
    SubmitButton,
    useResponsiveSubmission,
} from "../../components/SubmitButton";

import ControlSubmittedAndNoChange from "../../components/ControlSubmittedAndNoChange";

/*
 * Notes:
 * A sector contains a high and low field
 * The form contains a core and oven sector
 *
 * SANC stands for Submit And No Change (Submit button has been pressed and value has not been changed by user)
 */

// Constants for accessing inputs
const sectors = ["core", "oven"] as const;
type Sector = (typeof sectors)[number];
const limits = ["high", "low"] as const;
type Limit = (typeof limits)[number];

function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

/* ===========================================================================================
 *                                  Field State and Schema
 * =========================================================================================== */

function initFieldStateSANC() {
    const [value, setter] = useState<boolean>(false);
    return { val: value, set: setter };
}
type FieldStateSANC = ReturnType<typeof initFieldStateSANC>;

function getFieldSchema(fieldState: FieldStateSANC) {
    return z
        .preprocess(
            (val) => (Number.isNaN(val) ? undefined : Number(val)),
            z
                .number()
                .min(0, "Temperature cannot be below 0°C.")
                .max(500, "Temperature cannot be above 500°C.")
                .optional()
        )
        .refine(
            (val) => {
                // Return true if not submitted, or already changed
                // Otherwise, return true if val is defined
                return !fieldState.val || val !== undefined;
            },
            {
                message: "Temperature is invalid",
                path: [],
            }
        );
}

type FieldSchema = z.infer<ReturnType<typeof getFieldSchema>>;

/* ===========================================================================================
 *                                  Sector State and Schema
 * =========================================================================================== */

function initSectorStateSANC() {
    return Object.fromEntries(
        limits.map((limit) => [limit, initFieldStateSANC()])
    ) as Record<Limit, FieldStateSANC>;
}
type SectorStateSANC = ReturnType<typeof initSectorStateSANC>;

function getSectorSchema(sectorState: SectorStateSANC) {
    return z
        .object({
            high: getFieldSchema(sectorState.high),
            low: getFieldSchema(sectorState.low),
        })
        .superRefine((data, ctx) => {
            if (data.low && data.high && data.low >= data.high) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `High Temp must be above Low Temp.`,
                    path: ["high"],
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Low Temp must be below High Temp.`,
                    path: ["low"],
                });
            }
        });
}

/* ===========================================================================================
 *                                   Form State and Schema
 * =========================================================================================== */

function initFormStateSANC() {
    return Object.fromEntries(
        sectors.map((sector) => [sector, initSectorStateSANC()])
    ) as Record<Sector, SectorStateSANC>;
}
type FormStateSANC = ReturnType<typeof initFormStateSANC>;

function getFormSchema(formState: FormStateSANC) {
    return z
        .object({
            core: getSectorSchema(formState.core),
            oven: getSectorSchema(formState.oven),
        })
        .superRefine((data, ctx) => {
            if (
                data.core.low &&
                data.oven.high &&
                data.core.low < data.oven.high
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Core Low Temp cannot be below Oven High Temp.`,
                    path: ["core", "low"],
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Oven High Temp cannot be above Core Low Temp.`,
                    path: ["oven", "high"],
                });
            }
        });
}
type FormSchema = z.infer<ReturnType<typeof getFormSchema>>;

/* ===========================================================================================
 *                                         Components
 * =========================================================================================== */

function TemperatureField({
    sector,
    limit,
    fieldState,
}: {
    sector: Sector;
    limit: Limit;
    fieldState: FieldStateSANC;
}) {
    const [status, setStatus] = useState<boolean>(false);

    const path = `${sector}.${limit}` as const;

    const {
        formState: { errors },
        register,
    } = useFormContext<FormSchema>();

    const fieldError = errors?.[sector]?.[limit];

    return (
        <FloatingLabel
            controlId={`floatingInput-${path}`}
            label={limit}
            className="mb-3 text-center"
        >
            <ControlSubmittedAndNoChange
                startState={status}
                returnState={setStatus}
                type="number"
                placeholder=" "
                {...register(path, {
                    valueAsNumber: true,
                })}
                isInvalid={!!fieldError}
            />

            {fieldError && <Alert variant="danger">{fieldError.message}</Alert>}
        </FloatingLabel>
    );
}

function SectorFieldGroup({
    sector,
    sectorState,
}: {
    sector: Sector;
    sectorState: SectorStateSANC;
}) {
    const {
        watch,
        trigger,
        formState: { errors },
    } = useFormContext<FormSchema>();
    const highField = `${sector}.high` as const;
    const lowField = `${sector}.low` as const;

    useEffect(() => {
        trigger(highField);
    }, [watch(lowField), trigger]);

    useEffect(() => {
        trigger(lowField);
    }, [watch(highField), trigger]);

    return (
        <Form.Group className="mb-3">
            <Row>
                <Col md={{ span: 6, offset: 3 }}>
                    <Form.Label>{capitalise(sector)} Temperature</Form.Label>
                </Col>
            </Row>
            <Row>
                {limits.map((limit, i) => (
                    <Col md={i % 2 === 0 ? { span: 3, offset: 3 } : 3} key={i}>
                        <TemperatureField
                            sector={sector}
                            limit={limit}
                            fieldState={sectorState[limit]}
                        />
                    </Col>
                ))}
            </Row>
        </Form.Group>
    );
}

function FormFields({ formState }: { formState: FormStateSANC }) {
    const { watch, trigger } = useFormContext<FormSchema>();
    const coreLowField = "core.low" as const;
    const ovenHighField = "oven.high" as const;

    useEffect(() => {
        trigger(coreLowField);
    }, [watch(ovenHighField), trigger]);

    useEffect(() => {
        trigger(ovenHighField);
    }, [watch(coreLowField), trigger]);

    return (
        <>
            {sectors.map((sector, i) => (
                <SectorFieldGroup
                    key={i}
                    sector={sector}
                    sectorState={formState[sector]}
                />
            ))}
        </>
    );
}

function PresetSingle() {
    const fieldStates = initFormStateSANC();
    const setAllSANC = () => {
        fieldStates["core"]["high"].set(true);
        fieldStates["core"]["low"].set(true);
        fieldStates["oven"]["high"].set(true);
        fieldStates["oven"]["low"].set(true);
    };

    const formSchema = getFormSchema(fieldStates);

    const { ...methods } = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
    });

    const { handleSubmit } = methods;

    const { dispatch } = useResponsiveSubmission();

    // Stores form data
    const [dataToSend, sendData] = useState<FormSchema>();
    const [submitEvent, setSubmitEvent] =
        useState<React.FormEvent<HTMLFormElement>>();

    // When form data is updated, send it to api and update submit button text
    useEffect(() => {
        const fetchData = async () => {
            if (!dataToSend) return;
            const response = await fetch("/api/set-preset/single", {
                method: "POST",
                body: JSON.stringify(dataToSend),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                },
            });
            if (!response.ok) {
                dispatch(SubmitAction.FAIL);
            } else {
                dispatch(SubmitAction.SUCCEED);
            }
        };
        fetchData();
    }, [dataToSend]);

    // On successful validation set submit button text and send data
    const onSubmit = (data: FormSchema) => {
        dispatch(SubmitAction.SUBMIT);
        sendData(data);
    };

    // Handle the submit event (Seperate to allow isSubmitting to update)
    useEffect(() => {
        if (!submitEvent) return;
        handleSubmit(onSubmit)(submitEvent);
    }, [submitEvent]);

    // Cancel default behaviour then set submitting and submitEvent
    const handleSubmitWrapper = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAllSANC();
        setSubmitEvent(e);
    };

    return (
        <FormProvider {...methods}>
            <Form onSubmit={handleSubmitWrapper} noValidate>
                <FormFields formState={fieldStates} />
                <Row className="d-flex justify-content-center">
                    <Col xs={6} className="text-center">
                        <SubmitButton text={{ initial: "Save Preset" }} />
                    </Col>
                </Row>
            </Form>
        </FormProvider>
    );
}

export default PresetSingle;
