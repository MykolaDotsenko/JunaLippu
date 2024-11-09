import React from 'react';
import Link from 'next/link';

const TripOptions: React.FC = () => {
    const trips = [
        { id: 1, time: '5:31 - 8:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 2, time: '6:31 - 9:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 3, time: '7:25 - 10:53', duration: '3h 28 min', price: '35 euro', date: '06 May 2024' },
        { id: 4, time: '8:31 - 11:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 5, time: '9:31 - 12:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 6, time: '10:31 - 13:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 7, time: '11:31 - 14:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 8, time: '12:31 - 15:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 9, time: '13:31 - 16:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
        { id: 10, time: '14:31 - 17:53', duration: '3h 22 min', price: '35 euro', date: '06 May 2024' },
    ];

    return (
        <div className="space-y-4">
            {trips.map(trip => (
                <div key={trip.id} className="flex justify-between items-center p-4 border border-gray-300 rounded-md bg-gray-200">
                    <p className="text-lg font-medium text-black">
                        <Link href={`/Journey?time=${trip.time}&duration=${trip.duration}&price=${trip.price}&date=${trip.date}`}>
                            {trip.time}
                        </Link>
                    </p>
                    <p className="text-lg text-black">{trip.duration}</p>
                    <p className="text-lg text-black">{trip.price}</p>
                </div>
            ))}
        </div>
    );
}

export default TripOptions;
