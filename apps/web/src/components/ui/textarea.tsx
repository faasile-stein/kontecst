import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  helperText?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            // Base styles
            'flex min-h-[80px] w-full rounded-md border px-3 py-2',
            'bg-white text-sm text-neutral-900 placeholder:text-neutral-500',
            'transition-all duration-120',
            'resize-vertical',

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

Textarea.displayName = 'Textarea'

export { Textarea }
