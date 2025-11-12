import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, type, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            // Base styles
            'flex h-10 w-full rounded-md border px-3 py-2',
            'bg-white text-sm text-neutral-900 placeholder:text-neutral-500',
            'transition-all duration-120',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',

            // Focus styles
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20',

            // Disabled styles
            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-50',

            // Error state
            error
              ? 'border-danger focus-visible:ring-danger/20'
              : 'border-neutral-300 focus-visible:border-brand',

            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${props.id}-error`}
            className="mt-1.5 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${props.id}-helper`}
            className="mt-1.5 text-sm text-neutral-600"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
