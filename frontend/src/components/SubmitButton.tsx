import { type ComponentProps, useState, useEffect } from "react";

type SubmitAction = "RESET" | "SUBMIT" | "SUCCEED" | "FAIL";

interface Props {
    action?: SubmitAction
    text?: {
        resetText?: string;
        submitText?: string;
        succeedText?: string;
        failText?: string;
        delay?: number;
    };
}

type SubmitButtonProps = Props & ComponentProps<"button">;

function SubmitButton({ action = "RESET", text = {}, ...buttonProps }: SubmitButtonProps) {
    const [outerAction, setOuterAction] = useState<SubmitAction>("RESET");
    
    const {
        resetText = "Submit",
        submitText = "Submitting",
        succeedText = "Success",
        failText = "Error",
        delay = 1000,
    } = text;

    const [buttonText, setButtonText] = useState<string>(resetText);
    const [disabled, setDisabled] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<boolean>(false);

    const reset = () => {
        setButtonText(resetText);
        setDisabled(false);
    };

    const submit = () => {
        setButtonText(submitText);
        setDisabled(true);
    };

    const succeed = () => {
        setButtonText(succeedText);
        setCountdown(true);
    };

    const fail = (specificError = null) => {
        setButtonText(specificError || failText);
        setCountdown(true);
    };

    useEffect(() => {
        if (!countdown) {
            return;
        }
        const timeoutID = setTimeout(() => {
            reset();
            setCountdown(false);
        }, delay);

        return () => {
            clearTimeout(timeoutID)
        }
    }, [countdown]);

    if (action !== outerAction) {
        setOuterAction(action);
        switch (action) {
            case "RESET":
                reset();
                break;
            case "SUBMIT":
                submit();
                break;
            case "SUCCEED":
                succeed();
                break;
            case "FAIL":
                fail();
                break;
        }
    }



    return (
        <button type="submit" className="formButton" disabled={disabled} {...buttonProps}>
            {buttonText}
        </button>
    );
}

export {
    type SubmitAction,
    SubmitButton,
};