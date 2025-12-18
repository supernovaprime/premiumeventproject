// src/components/Loader.jsx
const Loader = ({ size = "medium", className = ""  }) => {
    const sizeClasses = {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12",
      full: "h-16 w-16"
    };
  
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div
          className={`
            animate-spin 
            rounded-full 
            border-4 
            border-gray-300 
            border-t-teal-600 
            ${sizeClasses[size]}
          `}
        />
      </div>
    );
  };
  
  export default Loader;