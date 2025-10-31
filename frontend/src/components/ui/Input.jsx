import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const Input = forwardRef(({ 
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200';
  
  const stateClasses = error 
    ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
    : success 
    ? 'border-success-300 focus:border-success-500 focus:ring-success-500'
    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';
  
  const iconClasses = leftIcon ? 'pl-10' : rightIcon ? 'pr-10' : '';
  
  const classes = `${baseClasses} ${stateClasses} ${iconClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={classes}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
        
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="w-4 h-4 text-error-500" />
          </div>
        )}
        
        {success && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CheckCircle className="w-4 h-4 text-success-500" />
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="mt-1">
          {error && (
            <p className="text-sm text-error-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
