import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-800 text-zinc-200 border-zinc-700",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        error: "bg-red-500/10 text-red-400 border-red-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
