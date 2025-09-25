import React from 'react';

interface SkeletonLoaderProps {
    rows?: number;
    columns?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ rows = 5, columns = 4 }) => {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-white/10">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className="p-3">
                            <div className="h-5 bg-gray-700/50 rounded-md animate-pulse"></div>
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
};

export default SkeletonLoader;
