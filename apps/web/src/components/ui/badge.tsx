import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200',
        primary: 'bg-brand/10 text-brand hover:bg-brand/20',
        success: 'bg-success/10 text-success hover:bg-success/20',
        warning: 'bg-warning/10 text-warning-dark hover:bg-warning/20',
        danger: 'bg-danger/10 text-danger hover:bg-danger/20',
        outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
    )
  }
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
