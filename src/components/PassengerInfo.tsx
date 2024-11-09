import React from 'react';
import { useRouter } from 'next/router';

const PassengerInfo: React.FC = () => {
    const router = useRouter();

    const handleCreate = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        event.preventDefault();
        router.push('/RegistrationPage');
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); 
    };

    return (
        <div className="relative">
            <form onSubmit={handleSubmit}>
                <h2 className="absolute left-[46px] top-[62px] font-inter italic font-bold text-[32px] leading-[39px] text-black">Sign in</h2>
                
                <label htmlFor="email" className="absolute left-[114px] top-[361px] font-inter font-bold text-[32px] leading-[39px] text-black">Email address:</label>
                <input type="email" id="email" className="absolute left-[75px] top-[417px] w-[607px] h-[104px] bg-[#D9D9D9]" />
                
                <label htmlFor="password" className="absolute left-[758px] top-[361px] font-inter font-bold text-[32px] leading-[39px] text-black">Password:</label>
                <input type="password" id="password" className="absolute left-[758px] top-[417px] w-[623px] h-[104px] bg-[#D9D9D9]" />
                
                <button type="submit" className="absolute left-[287px] top-[637px] w-[106px] h-[39px] font-inter font-bold text-[32px] leading-[39px] text-black bg-transparent">Sign in</button>
                
                <button type="button" className="absolute left-[930px] top-[633px] w-[110px] h-[39px] font-inter font-bold text-[32px] leading-[39px] text-black bg-transparent">Cancel</button>
                
                <p className="absolute left-[99px] top-[182px] font-inter italic font-medium text-[32px] leading-[39px] text-black">Do you have an account? If not, <button onClick={handleCreate} className="font-inter italic font-medium text-[32px] leading-[39px] text-black bg-transparent">Create</button></p>
                
                <button type="button" className="absolute left-[828px] top-[171px] w-[179px] h-[39px] font-inter italic font-medium text-[32px] leading-[39px] text-black bg-transparent">If no Create</button>
            </form>
        </div>
    );
}

export default PassengerInfo;
