import React from 'react';

const StepButtons: React.FC = () => {
    return (
        <div className="relative flex justify-between items-center">
            <button className="w-[77px] h-[39px] font-inter font-normal text-[32px] leading-[39px] text-black">
                1
            </button>
            <button className="w-[77px] h-[39px] font-inter font-normal text-[32px] leading-[39px] text-black">
                2
            </button>
            <button className="w-[77px] h-[39px] font-inter font-normal text-[32px] leading-[39px] text-black">
                3
            </button>
            <button className="w-[77px] h-[39px] font-inter font-normal text-[32px] leading-[39px] text-black">
                Done
            </button>
        </div>
    );
}

export default StepButtons;
