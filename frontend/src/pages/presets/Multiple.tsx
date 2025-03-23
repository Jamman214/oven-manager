import { useEffect, useState } from "react";
import { number, z } from "zod";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Dropdown from "../../components/Dropdown";

interface Item {
    id: number;
    name: string;
}

function PresetMultiple() {
    // Options from fetched dropdown
    const [options, returnOptions] = useState<Item[]>([]);

    // Status of submission
    const [isSubmitting, setSubmitting] = useState<boolean>(false);

    // Schema for dropdowns to force a selection
    const dropdownSchema = z.coerce
        .number()
        .refine((val) => val >= 0, { message: "Select a preset", path: [] });

    // Define the schema for a single time entry
    const presetSchema = z.object({
        time: z
            .string()
            .transform((time) => {
                const match = time.match(/^(\d{2}):(\d{2})$/);
                if (match === null) {
                    return undefined;
                }
                return {
                    hour: parseInt(match[1], 10),
                    minute: parseInt(match[2], 10),
                };
            })
            // When submitting show error if not in the format HH:MM
            .refine((val) => !isSubmitting || val !== undefined, {
                message: "Invalid time format",
                path: [],
            })
            // When submitting show error if not a valid time
            .refine(
                (val) => {
                    if (isSubmitting) {
                        return true;
                    }
                    if (val === undefined) {
                        return true;
                    }
                    console.log(val);
                    if (val.hour > 23 || val.hour < 0) {
                        return false;
                    }
                    if (val.minute > 59 || val.minute < 0) {
                        return false;
                    }
                    return true;
                },
                { message: "Invalid time", path: [] }
            ),
        preset: dropdownSchema,
    });

    // Define the form schema with validation
    const formSchema = z.object({
        firstPreset: dropdownSchema,
        followingPresets: z.array(presetSchema).superRefine((data, ctx) => {
            for (let i = 1; i < data.length; i++) {
                const currentTime = data[i]?.time;
                const previousTime = data[i - 1]?.time;
                if (currentTime === undefined || previousTime === undefined) {
                    continue;
                }
                if (currentTime.hour > previousTime.hour) {
                    continue;
                }
                if (
                    currentTime.hour < previousTime.hour ||
                    currentTime.minute <= previousTime.minute
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `This time must be after the one before it`,
                        path: [i, "time"],
                    });
                    continue;
                }
            }
        }),
    });

    // Define TypeScript types based on the schema
    type FormValues = z.infer<typeof formSchema>;

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstPreset: -1,
            followingPresets: [],
        },
        mode: "onChange",
    });

    // Setup field array for dynamic times and presets added to form
    const { fields, append, remove } = useFieldArray({
        control,
        name: "followingPresets",
    });

    // Form submission logic
    const [dataToSend, sendData] = useState<FormValues>();

    useEffect(() => {
        if (!dataToSend) return;
        fetch("/api/set-preset/multiple", {
            method: "POST",
            body: JSON.stringify(dataToSend),
            headers: {
                "Content-type": "application/json; charset=UTF-8",
            },
        });
    }, [dataToSend]);

    const onSubmit = (data: FormValues) => {
        console.log("Form submitted:", data);
        sendData(data);
    };

    const handleSubmitWrapper = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => {
            handleSubmit(onSubmit)(e);
            setSubmitting(false);
        }, 0);
    };

    // Actual form
    return (
        <Form onSubmit={handleSubmitWrapper} noValidate>
            <Form.Group className="mb-3 mt-3">
                <Row>
                    <Col className="mb-3" xs={12} md={{ span: 6, offset: 3 }}>
                        <Controller
                            control={control}
                            name="firstPreset"
                            render={({ field }) => (
                                <Dropdown
                                    route="/api/get-presets/single"
                                    returnData={returnOptions}
                                    registerData={{
                                        value: field.value,
                                        onChange: field.onChange,
                                        onBlur: field.onBlur,
                                    }}
                                />
                            )}
                        />
                        {errors.firstPreset && (
                            <Alert variant="danger">
                                {errors.firstPreset.message}
                            </Alert>
                        )}
                    </Col>
                </Row>

                {fields.map((field2, index) => {
                    return (
                        <Row key={field2.id}>
                            <Col
                                className="mb-3"
                                xs={12}
                                md={{ span: 6, offset: 3 }}
                            >
                                <FloatingLabel
                                    controlId={`floatingInput-time-${index}`}
                                    label="End Time"
                                >
                                    <Form.Control
                                        type="time"
                                        placeholder="HH:MM"
                                        {...register(
                                            `followingPresets.${index}.time`
                                        )}
                                    />
                                    {errors.followingPresets?.[index]?.time && (
                                        <Alert variant="danger">
                                            {
                                                errors.followingPresets[index]
                                                    ?.time?.message
                                            }
                                        </Alert>
                                    )}
                                </FloatingLabel>
                            </Col>
                            <Col
                                className="mb-3"
                                xs={12}
                                md={{ span: 6, offset: 3 }}
                            >
                                <Controller
                                    control={control}
                                    name={`followingPresets.${index}.preset`}
                                    render={({ field }) => (
                                        <Dropdown
                                            options={options}
                                            registerData={{
                                                value: field.value,
                                                onChange: field.onChange,
                                                onBlur: field.onBlur,
                                            }}
                                        />
                                    )}
                                />
                                {errors.followingPresets?.[index]?.preset && (
                                    <Alert variant="danger">
                                        {
                                            errors.followingPresets[index]
                                                ?.preset?.message
                                        }
                                    </Alert>
                                )}
                            </Col>
                        </Row>
                    );
                })}
            </Form.Group>
            <Row>
                <Col xs={3} md={4} className="d-flex justify-content-end">
                    <Button
                        type="button"
                        onClick={() => {
                            remove(fields.length - 1);
                        }}
                    >
                        -
                    </Button>
                </Col>
                <Col xs={6} md={4} className="d-flex justify-content-center">
                    <Button type="submit">Save Preset</Button>
                </Col>
                <Col xs={3} md={4} className="d-flex justify-content-start">
                    <Button
                        type="button"
                        onClick={() => {
                            append(
                                { time: undefined, preset: -1 },
                                { shouldFocus: false }
                            );
                        }}
                    >
                        +
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}

export default PresetMultiple;
