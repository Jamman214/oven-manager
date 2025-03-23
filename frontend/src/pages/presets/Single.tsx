import { useEffect, useState } from "react";
import { number, z } from "zod";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function PresetSingle() {
    // Used to prevent error messages for blank inputs when not submitting (I think they're annoying)
    const [isSubmitting, setSubmitting] = useState<boolean>(false);
    const [formEvent, setFormEvent] =
        useState<React.FormEvent<HTMLFormElement>>();

    // Constants for accessing inputs
    const sectors = ["core", "oven"] as const;
    const limits = ["high", "low"] as const;

    // Used to individually control submitting status for each input
    // Without this, when updating paired error messages, it would remove messages produced when submitting
    // i.e. The Invalid Temperature message
    const submitMap = () => {
        const [isSubmittingVal, setSubmittingVal] = useState<boolean>(false);
        return { val: isSubmittingVal, set: setSubmittingVal };
    };
    const isSubmittings = {
        core: { high: submitMap(), low: submitMap() },
        oven: { high: submitMap(), low: submitMap() },
    };

    // Schema for each individual input, paired to its submit status to prevent certain errors appearing
    // before submissions, and to prevent those same messages dissapearing after submission before changes
    // are made to the input field
    const numSchema = (sector: "core" | "oven", limit: "high" | "low") =>
        z
            .preprocess(
                (val) => (Number.isNaN(val) ? undefined : Number(val)), // Convert empty string to undefined
                z
                    .number()
                    .min(0, "Temperature cannot be below 0°C.")
                    .max(500, "Temperature cannot be above 500°C.")
                    .optional()
            )
            .refine(
                (val) => {
                    console.log(isSubmittings[sector][limit], val);
                    return (
                        !isSubmittings[sector][limit].val || val !== undefined
                    );
                },
                {
                    message: "Temperature is invalid",
                    path: [],
                }
            );

    // Schema which enforces high temp being above low temp
    const sectorSchema = (sector: "core" | "oven") => {
        return z
            .object({
                high: numSchema(sector, "high"),
                low: numSchema(sector, "low"),
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
    };

    // Schema which enforces core temp being above oven temp
    const formSchema = z
        .object({
            core: sectorSchema("core"),
            oven: sectorSchema("oven"),
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

    // Define TypeScript types based on the schema
    type FormValues = z.infer<typeof formSchema>;

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        trigger,
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
    });

    // Update error messages in each sector when other limit updates
    for (const sector of sectors) {
        for (let i = 0; i < 2; i++) {
            const watcher = watch(`${sector}.${limits[i]}`);

            useEffect(() => {
                trigger(`${sector}.${limits[(i + 1) % 2]}`);
            }, [watcher, trigger]);
        }
    }

    // Update error messages between sectors when they overlap
    useEffect(() => {
        trigger("oven.high");
    }, [watch("core.low"), trigger]);

    useEffect(() => {
        trigger("core.low");
    }, [watch("oven.high"), trigger]);

    // Sets isSubmitting to true globally and for all elements
    const handleSubmitWrapper = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormEvent(e);
        isSubmittings["core"]["high"].set(true);
        isSubmittings["core"]["low"].set(true);
        isSubmittings["oven"]["high"].set(true);
        isSubmittings["oven"]["low"].set(true);
        setSubmitting(true);
    };

    // Function to run on success
    const onSubmit = (data: FormValues) => {
        console.log("Submitted data:", data);
    };

    // Attempts to submit form
    useEffect(() => {
        if (!isSubmitting) {
            return;
        }
        console.log("issubmitting: ", isSubmitting);
        handleSubmit(onSubmit)(formEvent);
        setSubmitting(false);
    }, [isSubmitting]);

    // Web page
    const limitInputs = (sector: "core" | "oven", i: number) => {
        return limits.map((limit, j) => {
            const field = `${sector}.${limit}`; // Combine sector and limit into a single type
            const fieldError = errors?.[sector]?.[limit]; // Get possibly undefined key
            return (
                <Col md={j % 2 === 0 ? { span: 3, offset: 3 } : 3} key={j}>
                    <FloatingLabel
                        controlId={"floatingInput-" + field}
                        label={limit}
                        className="mb-3 text-center"
                    >
                        <Form.Control
                            type="number"
                            placeholder=" "
                            {...register(`${sector}.${limit}`, {
                                valueAsNumber: true,
                            })}
                            isInvalid={!!fieldError}
                            onChange={(e) => {
                                // Call the existing registered onChange handler
                                register(`${sector}.${limit}`).onChange(e);

                                // Your additional action
                                isSubmittings[sector][limit].set(false);
                            }}
                        />

                        {fieldError && (
                            <Alert variant="danger">{fieldError.message}</Alert>
                        )}
                    </FloatingLabel>
                </Col>
            );
        });
    };

    const sectorInputs = (() => {
        return sectors.map((sector, i) => {
            return (
                <Form.Group className="mb-3" key={i}>
                    <Row>
                        <Col md={{ span: 6, offset: 3 }}>
                            <Form.Label>
                                {capitalise(sector)} Temperature
                            </Form.Label>
                        </Col>
                    </Row>
                    <Row>{limitInputs(sector, i)}</Row>
                </Form.Group>
            );
        });
    })();

    return (
        <Form onSubmit={handleSubmitWrapper} noValidate>
            {sectorInputs}
            <Row className="d-flex justify-content-center">
                <Col xs={6} className="text-center">
                    <Button type="submit">Save Preset</Button>
                </Col>
            </Row>
        </Form>
    );
}

export default PresetSingle;
