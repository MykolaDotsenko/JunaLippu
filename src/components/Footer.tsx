import React, { useState } from 'react';

const Footer: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setActiveSection(activeSection === section ? null : section);
    };

    return (
        <footer className="mt-8">
            <nav className="flex flex-col items-center space-y-4">
                {/* Conditional text rendering */}
                {activeSection === 'dataProtection' && (
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto mb-4">
                        <h3 className="text-gray-800 text-2xl font-semibold mb-2">Data Protection</h3>
                        <p className="text-gray-600 text-base leading-relaxed">
                            We value your privacy and are committed to protecting your personal data. Please review our data protection policies to understand how we collect, use, and safeguard your information.
                        </p>
                    </div>
                )}

                {activeSection === 'termsConditions' && (
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto mb-4">
                        <h3 className="text-gray-800 text-2xl font-semibold mb-2">Terms and Conditions</h3>
                        <p className="text-gray-600 text-base leading-relaxed">
                            Our terms and conditions outline the rules and guidelines for using our services. By using our platform, you agree to comply with these terms. Please read them carefully.
                        </p>
                    </div>
                )}

                {activeSection === 'customerService' && (
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto mb-4">
                        <h3 className="text-gray-800 text-2xl font-semibold mb-2">Customer Service</h3>
                        <p className="text-gray-600 text-base leading-relaxed">
                            Our customer service team is here to assist you with any questions or issues you may have. Contact us for support, and we will be happy to help.
                        </p>
                    </div>
                )}

                {activeSection === 'faq' && (
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl mx-auto mb-4">
                        <h3 className="text-gray-800 text-2xl font-semibold mb-2">FAQ</h3>
                        <p className="text-gray-600 text-base leading-relaxed">
                            Find answers to the most frequently asked questions about our services and platform. If you have any additional questions, feel free to reach out to our support team. Thanks.
                        </p>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-center space-x-4">
                    <button onClick={() => toggleSection('dataProtection')} className="font-inter italic font-normal text-[32px] leading-[39px] text-black">
                        Data Protection
                    </button>
                    <button onClick={() => toggleSection('termsConditions')} className="font-inter italic font-normal text-[32px] leading-[39px] text-black">
                        Terms and Conditions
                    </button>
                    <button onClick={() => toggleSection('customerService')} className="font-inter italic font-normal text-[32px] leading-[39px] text-black">
                        Customer Service
                    </button>
                    <button onClick={() => toggleSection('faq')} className="font-inter italic font-normal text-[32px] leading-[39px] text-black">
                        FAQ
                    </button>
                </div>
            </nav>
        </footer>
    );
};

export default Footer;
