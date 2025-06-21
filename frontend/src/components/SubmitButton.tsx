import React, {
    createContext,
    useState,
    useContext,
    type ReactNode,
    useEffect,
} from "react";
import Button from "react-bootstrap/Button";

type SubmitAction = "RESET" | "SUBMIT" | "SUCCEED" | "FAIL";

interface Props {
    text?: {
        resetText?: string;
        submitText?: string;
        succeedText?: string;
        failText?: string;
        delay?: number;
    };
}

type SubmitButtonProps = Props & React.ComponentProps<typeof Button>;

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
        <Button type="submit" disabled={disabled} {...buttonProps}>
            {buttonText}
        </Button>
    );
}

export {
    type SubmitAction,
    SubmitButton,
};