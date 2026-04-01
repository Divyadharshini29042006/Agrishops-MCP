import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const FarmerDashboard = () => {
    const { user } = useAuth();

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
                    <p className="text-gray-600">Welcome back, {user?.name || 'Farmer'}</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-2">Crop Advisory</h3>
                        <p className="text-gray-600 text-sm">Need help with your crops? Ask our AI chatbot for immediate expert advice.</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-2">My Orders</h3>
                        <p className="text-gray-600 text-sm">Track your recent seed and pesticide purchases.</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold mb-2">Weather Forecast</h3>
                        <p className="text-gray-600 text-sm">Check the latest weather updates for your region.</p>
                    </div>
                </div>

                <section className="mt-12">
                    <h2 className="text-2xl font-semibold mb-4 text-emerald-800">Expert Tips</h2>
                    <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100">
                        <ul className="list-disc list-inside space-y-2 text-emerald-900">
                            <li>Rotate crops regularly to maintain soil health.</li>
                            <li>Use organic fertilizers where possible.</li>
                            <li>Monitor for pests daily in the early morning.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default FarmerDashboard;
