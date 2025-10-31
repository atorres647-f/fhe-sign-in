import { CalendarCheck, Loader } from 'lucide-react';
import './SignInButton.css';

interface SignInButtonProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  isDisabled: boolean;
}

export function SignInButton({ onSignIn, isLoading, isDisabled }: SignInButtonProps) {
  return (
    <button
      className="signin-btn"
      onClick={onSignIn}
      disabled={isDisabled || isLoading}
    >
      {isLoading ? (
        <>
          <Loader size={20} className="spin" />
          <span>Signing in...</span>
        </>
      ) : isDisabled ? (
        <>
          <CalendarCheck size={20} />
          <span>Come back tomorrow</span>
        </>
      ) : (
        <>
          <CalendarCheck size={20} />
          <span>Sign In</span>
        </>
      )}
    </button>
  );
}


