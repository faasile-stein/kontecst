import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-semibold rounded-md',
          'transition-all duration-120 ease-out',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-opacity-30',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',

          // Variant styles
          {
            // Primary - Brand gradient
            'bg-brand-gradient text-white shadow-soft hover:shadow-lift hover:-translate-y-0.5 active:translate-y-0':
              variant === 'primary',

            // Secondary - Outline
            'bg-transparent border border-neutral-400 text-neutral-800 hover:bg-neutral-100 hover:border-neutral-500':
              variant === 'secondary',

            // Danger - Red solid
            'bg-danger text-white shadow-soft hover:bg-danger-dark hover:shadow-lift hover:-translate-y-0.5 focus-visible:ring-danger':
              variant === 'danger',

            // Ghost - No border, subtle hover
            'bg-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900':
              variant === 'ghost',
          },

          // Size styles
          {
            'px-3 py-2 text-sm': size === 'sm',
            'px-4 py-3 text-base': size === 'md',
            'px-6 py-3.5 text-lg': size === 'lg',
          },

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
