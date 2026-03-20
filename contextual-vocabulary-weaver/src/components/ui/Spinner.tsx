interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Spinner({ size = 'medium', className = '' }: SpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-block ${sizeClasses[size]} ${className}`}
    >
      <div className="w-full h-full border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"
    >
      <Spinner size="large" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );
}
