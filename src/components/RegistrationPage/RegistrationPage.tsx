import React from 'react';

const RegistrationPage: React.FC = () => {
    return (
        <div className="relative">
            <form>
                {/* Rectangle 47 */}
                <div className="absolute left-[95px] top-[152px] w-[572px] h-[99px] bg-[#D9D9D9]" />

                {/* Name Label */}
                <label
                    htmlFor="name"
                    className="absolute left-[238px] top-[178px] font-inter italic font-medium text-[32px] leading-[39px] text-black"
                >
                    Name:
                </label>
                <input
                    type="text"
                    id="name"
                    className="absolute left-[238px] top-[228px] w-[286px] h-[32px] bg-white border border-gray-300 rounded-md"
                />

                {/* Rectangle 49 */}
                <div className="absolute left-[757px] top-[152px] w-[618px] h-[99px] bg-[#D9D9D9]" />

                {/* Surname Label */}
                <label
                    htmlFor="surname"
                    className="absolute left-[876px] top-[178px] font-inter italic font-medium text-[32px] leading-[39px] text-black"
                >
                    Surname:
                </label>
                <input
                    type="text"
                    id="surname"
                    className="absolute left-[876px] top-[228px] w-[286px] h-[32px] bg-white border border-gray-300 rounded-md"
                />

                {/* Rectangle 48 */}
                <div className="absolute left-[89px] top-[313px] w-[578px] h-[81px] bg-[#D9D9D9]" />

                {/* Email Address Label */}
                <label
                    htmlFor="email"
                    className="absolute left-[238px] top-[334px] font-inter font-bold text-[32px] leading-[39px] text-black"
                >
                    Email address:
                </label>
                <input
                    type="email"
                    id="email"
                    className="absolute left-[238px] top-[384px] w-[286px] h-[32px] bg-white border border-gray-300 rounded-md"
                />

                {/* Rectangle 50 */}
                <div className="absolute left-[757px] top-[313px] w-[618px] h-[81px] bg-[#D9D9D9]" />

                {/* Mobile Number Label */}
                <label
                    htmlFor="mobile"
                    className="absolute left-[876px] top-[342px] font-inter font-bold text-[32px] leading-[39px] text-black"
                >
                    Mobile number:
                </label>
                <input
                    type="text"
                    id="mobile"
                    className="absolute left-[876px] top-[384px] w-[286px] h-[32px] bg-white border border-gray-300 rounded-md"
                />

                {/* Rectangle 51 */}
                <div className="absolute left-[225px] top-[512px] w-[956px] h-[115px] bg-[rgba(56,86,37,0.45)] rounded-[25px]" />

                {/* Sign Up Button */}
                <button
                    type="submit"
                    className="absolute left-[618px] top-[550px] font-inter font-bold text-[32px] leading-[39px] text-black"
                >
                    Sign up
                </button>

                {/* Back Button */}
                <button
                    type="button"
                    className="absolute left-[1064px] top-[840px] font-inter font-bold text-[40px] leading-[48px] text-black"
                >
                    Back
                </button>
            </form>
        </div>
    );
};

export default RegistrationPage;
