import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-black/10 dark:bg-white/15", className)}
      {...props}
    />
  )
}

export { Skeleton }
