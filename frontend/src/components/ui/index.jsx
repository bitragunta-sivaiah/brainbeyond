import React from "react";
import { useController } from "react-hook-form";
import clsx from "clsx";
import { format } from "date-fns";

export const Input = ({ name, label, control, required, type = "text", ...props }) => {
  const { field, fieldState: { error } } = useController({ name, control, rules: { required: required ? "This field is required" : false } });
  return (
    <div className="flex flex-col space-y-1">
      {label && <label htmlFor={name} className="text-sm font-medium text-muted-foreground">{label}{required && <span className="text-destructive">*</span>}</label>}
      <input
        {...field}
        id={name}
        type={type}
        className={clsx(
          "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive"
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
};

export const Textarea = ({ name, label, control, required, ...props }) => {
  const { field, fieldState: { error } } = useController({ name, control, rules: { required: required ? "This field is required" : false } });
  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor={name} className="text-sm font-medium text-muted-foreground">{label}{required && <span className="text-destructive">*</span>}</label>
      <textarea
        {...field}
        id={name}
        className={clsx(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive"
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
};

export const Button = ({ children, variant = "default", size = "default", className, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  return (
    <button
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};

export const Checkbox = ({ name, label, control, ...props }) => {
  const { field } = useController({ name, control });
  return (
    <div className="flex items-center space-x-2">
      <input
        {...field}
        id={name}
        type="checkbox"
        checked={field.value || false}
        onChange={(e) => field.onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <label htmlFor={name} className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
    </div>
  );
};

export const DatePicker = ({ name, label, control, required, ...props }) => {
  const { field, fieldState: { error } } = useController({ name, control, rules: { required: required ? "This field is required" : false } });

  const displayValue = field.value ? format(new Date(field.value), "yyyy-MM-dd") : "";

  return (
    <div className="flex-1 space-y-1">
      <label htmlFor={name} className="text-sm font-medium text-muted-foreground">{label}{required && <span className="text-destructive">*</span>}</label>
      <input
        type="date"
        {...field}
        value={displayValue}
        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
        id={name}
        className={clsx(
          "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive"
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
};

export const Select = ({ name, label, control, required, children, ...props }) => {
  const { field, fieldState: { error } } = useController({ name, control, rules: { required: required ? "This field is required" : false } });
  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor={name} className="text-sm font-medium text-muted-foreground">{label}{required && <span className="text-destructive">*</span>}</label>
      <select
        {...field}
        id={name}
        className={clsx(
          "h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive"
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
};