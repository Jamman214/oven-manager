import Button from "react-bootstrap/Button";
import { useState, ButtonHTMLAttributes, useEffect } from "react";

interface Props {
    text?: {
        initial?: string;
        submitting?: string;
        success?: string;
        error?: string;
        delay?: number;
    };
}

type SubmitButtonProps = Props & ButtonHTMLAttributes<HTMLButtonElement>;

function SubmitButton({ text = {}, ...buttonProps }: SubmitButtonProps) {
    const {
        initial = "Submit",
        submitting = "Submitting",
        success = "Success",
        error = "Error",
        delay = 1000,
    } = text;

    const [buttonText, setButtonText] = useState<string>(initial);
    const [disabled, setDisabled] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<boolean>(false);

    const setInitial = () => {
        setButtonText(initial);
        setDisabled(false);
    };

    const setSubmitting = () => {
        setButtonText(submitting);
        setDisabled(true);
    };

    const setSuccess = () => {
        setButtonText(success);
        setCountdown(true);
    };

    const setError = (specificError = null) => {
        setButtonText(specificError || error);
        setCountdown(true);
    };

    useEffect(() => {
        if (!countdown) {
            return;
        }
        setTimeout(() => {
            setInitial();
            setCountdown(false);
        }, delay);
    }, [countdown]);

    return {
        button: (
            <Button type="submit" disabled={disabled} {...buttonProps}>
                {buttonText}
            </Button>
        ),
        setToSubmit: setSubmitting,
        setToSuccess: setSuccess,
        setToError: setError,
    };
}

export default SubmitButton;
