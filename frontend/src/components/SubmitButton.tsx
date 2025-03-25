import React, {
    createContext,
    useState,
    useContext,
    ReactNode,
    useReducer,
    useEffect,
} from "react";
import Button from "react-bootstrap/Button";

enum SubmitAction {
    RESET = "RESET",
    SUBMIT = "SUBMITTING",
    SUCCEED = "SUCCESS",
    FAIL = "FAIL",
}

// Create a context for form submission state and handling
const ResponsiveSubmissionContext = createContext<
    | {
          submitState: SubmitAction;
          dispatch: React.Dispatch<React.SetStateAction<SubmitAction>>;
      }
    | undefined
>(undefined);

// Custom hook to use the form submission context
const useResponsiveSubmission = () => {
    const context = useContext(ResponsiveSubmissionContext);
    if (!context) {
        throw new Error(
            "useResponsiveSubmission must be used within a ResponsiveSubmissionProvider"
        );
    }
    return context;
};

const ResponsiveSubmissionProvider = ({
    children,
}: {
    children?: ReactNode;
}) => {
    const [submitState, dispatch] = useState<SubmitAction>(SubmitAction.RESET);

    return (
        <ResponsiveSubmissionContext.Provider
            value={{ submitState: submitState, dispatch: dispatch }}
        >
            {children}
        </ResponsiveSubmissionContext.Provider>
    );
};

interface Props {
    text?: {
        initial?: string;
        submitting?: string;
        success?: string;
        error?: string;
        delay?: number;
    };
}

type SubmitButtonProps = Props & React.ComponentProps<typeof Button>;

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

    const { submitState } = useResponsiveSubmission();

    const reset = () => {
        setButtonText(initial);
        setDisabled(false);
    };

    const submit = () => {
        setButtonText(submitting);
        setDisabled(true);
    };

    const succeed = () => {
        setButtonText(success);
        setCountdown(true);
    };

    const fail = (specificError = null) => {
        setButtonText(specificError || error);
        setCountdown(true);
    };

    useEffect(() => {
        if (!countdown) {
            return;
        }
        setTimeout(() => {
            reset();
            setCountdown(false);
        }, delay);
    }, [countdown]);

    useEffect(() => {
        switch (submitState) {
            case SubmitAction.RESET:
                reset();
                break;
            case SubmitAction.SUBMIT:
                submit();
                break;
            case SubmitAction.SUCCEED:
                succeed();
                break;
            case SubmitAction.FAIL:
                fail();
                break;
        }
    }, [submitState]);

    return (
        <Button type="submit" disabled={disabled} {...buttonProps}>
            {buttonText}
        </Button>
    );
}

export {
    SubmitAction,
    SubmitButton,
    useResponsiveSubmission,
    ResponsiveSubmissionProvider,
};
