// frontend/src/components/Skeleton.jsx
import React from 'react';

/**
 * Reusable Skeleton loader component for better perceived performance
 * @param {string} variant - 'text', 'circular', 'rectangular'
 * @param {string} width - CSS width (e.g. '100%', '200px')
 * @param {string} height - CSS height
 * @param {string} className - Additional Tailwind classes
 */
const Skeleton = ({
    variant = 'text',
    width,
    height,
    className = ''
}) => {
    const baseClass = "animate-pulse bg-gray-200";

    let variantClass = "rounded";
    if (variant === 'circular') variantClass = "rounded-full";
    if (variant === 'rectangular') variantClass = "rounded-md";

    // Default text height if not provided
    const defaultHeight = variant === 'text' ? '1rem' : 'auto';

    return (
        <div
            className={`${baseClass} ${variantClass} ${className}`}
            style={{
                width: width || '100%',
                height: height || defaultHeight,
                marginBottom: variant === 'text' ? '0.5rem' : '0'
            }}
        />
    );
};

export default Skeleton;
