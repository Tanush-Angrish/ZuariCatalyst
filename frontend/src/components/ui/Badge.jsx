import * as React from "react"
import { cn } from "../../lib/utils"

function Badge({ className, variant = "default", ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2",
        {
          "border-transparent bg-brand-blue text-white hover:bg-brand-blue/80": variant === "default",
          "border-transparent bg-[#99CC33]/10 text-[#7a9d2d]": variant === "success",
          "border-transparent bg-[#DE0F17]/10 text-[#DE0F17]": variant === "destructive",
          "border-transparent bg-yellow-100 text-yellow-800": variant === "warning",
          "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200": variant === "secondary",
          "text-brand-black": variant === "outline"
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
