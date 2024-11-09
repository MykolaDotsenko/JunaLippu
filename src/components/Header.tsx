import React, { useState } from 'react';
import { useRouter } from 'next/router';

const Header: React.FC = () => {
    const router = useRouter();
    const [showDescription, setShowDescription] = useState(false);

    const handleShowPassengerInfo = () => {
        router.push('/PassengerInfoPage');
    };

    const toggleDescription = () => {
        setShowDescription(!showDescription);
    };

    const navigateToMainPage = () => {
        router.push('/MainPage'); // Replace '/MainPage' with your actual main page route
    };

    return (
        <header className="h-24 text-white p-4 flex justify-between items-center relative">
            <div className="absolute left-0 top-0 h-full flex items-center" style={{ marginLeft: '50px' }}>
                {/* logo */}
                <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="h-full rounded-full"
                    style={{
                        width: '199px',
                        borderRadius: '60px',
                    }}
                />
            </div>
            <nav className="ml-auto" style={{ paddingRight: '236px' }}>
                <ul className="flex space-x-4">
                    <li>
                        <button onClick={navigateToMainPage} className="text-black font-bold py-2 px-4 hover:text-gray-300"
                                style={{ fontFamily: 'Inter', fontWeight: 700, fontStyle: 'italic', fontSize: '24px', lineHeight: '29.05px' }}>
                            HOME
                        </button>
                    </li>
                    <li>
                        <button onClick={toggleDescription} className="text-black font-bold py-2 px-4 hover:text-gray-300"
                                style={{ fontFamily: 'Inter', fontWeight: 700, fontStyle: 'italic', fontSize: '24px', lineHeight: '29.05px' }}>
                            ABOUT
                        </button>
                    </li>
                    <li>
                        <button onClick={handleShowPassengerInfo} className="text-black font-bold py-2 px-4 hover:text-gray-300"
                                style={{ fontFamily: 'Inter', fontWeight: 700, fontStyle: 'italic', fontSize: '24px', lineHeight: '29.05px' }}>
                            LOG IN
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Conditional rendering of description */}
            {showDescription && (
                <div className="absolute bg-white rounded-lg shadow-lg p-6 top-16 right-0 z-20 max-w-sm">
                    <h3 className="text-gray-800 text-xl font-semibold mb-2">About Us</h3>
                    <p className="text-gray-600 text-base leading-relaxed">
                        Junalippu is a user-friendly and intuitive application designed to streamline your travel planning experience. We make it easy for you to find the best routes, select travel classes, and manage all the details of your journey with just a few clicks.
                    </p>
                </div>
            )}
        </header>
    );
}

export default Header;
