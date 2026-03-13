import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-brand-blue text-white shadow-md hover:bg-brand-blue/90 hover:shadow-lg hover:-translate-y-0.5": variant === "default",
          "bg-[#DE0F17] text-white shadow-sm hover:bg-[#DE0F17]/90 hover:shadow-md hover:-translate-y-0.5": variant === "danger",
          "bg-[#99CC33] text-white shadow-sm hover:bg-[#99CC33]/90 hover:shadow-md hover:-translate-y-0.5": variant === "success",
          "border border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:text-brand-blue text-brand-black": variant === "outline",
          "hover:bg-brand-blue/5 hover:text-brand-blue text-gray-600": variant === "ghost",
          "h-9 px-4 py-2": size === "default",
          "h-8 rounded-md px-3 text-xs": size === "sm",
          "h-10 rounded-md px-8": size === "lg",
          "h-9 w-9": size === "icon",
        },
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
