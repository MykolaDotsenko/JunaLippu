import React from 'react';

const Navigation: React.FC = () => {
    return (
        <div className="flex justify-between">
            <button className="px-4 py-2 bg-transparent border border-black text-black font-bold rounded hover:bg-gray-100">
                Previous day
            </button>
            <button className="px-4 py-2 bg-transparent border border-black text-black font-bold rounded hover:bg-gray-100">
                Next Day
            </button>
        </div>
    );
}

export default Navigation;
