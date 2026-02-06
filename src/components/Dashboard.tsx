import React, { useMemo } from 'react';
import type { ElectionResult } from '../types/election';
import { tamilTranslations, partyColors } from '../data/translations';
import { partyTranslations } from '../data/tamilData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import AdvancedVisuals from './AdvancedVisuals';

interface DashboardProps {
    data: ElectionResult[];
}

const SPA_PARTIES = ['DMK', 'INC', 'VCK', 'CPI', 'CPM', 'CPI(M)', 'IUML', 'MDMK', 'KMDK', 'MMK'];
const NDA_PARTIES = ['ADMK', 'BJP', 'PMK', 'TMC(M)'];

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
    // Process data to find winners
    const winners = useMemo(() => {
        return data.filter(d => d.Position === 1);
    }, [data]);

    const partyWins = useMemo(() => {
        const counts: Record<string, number> = {};
        winners.forEach(w => {
            const party = w.Party;
            counts[party] = (counts[party] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({
                name,
                nameTA: partyTranslations[name] || name,
                value
            }))
            .sort((a, b) => b.value - a.value);
    }, [winners]);

    const allianceWins = useMemo(() => {
        const counts = { 'DMK+': 0, 'ADMK+': 0, 'Others': 0 };
        winners.forEach(w => {
            if (SPA_PARTIES.includes(w.Party)) counts['DMK+']++;
            else if (NDA_PARTIES.includes(w.Party)) counts['ADMK+']++;
            else counts['Others']++;
        });
        return [
            { name: tamilTranslations.DMKAlliance, value: counts['DMK+'], color: '#ff0000' },
            { name: tamilTranslations.ADMKAlliance, value: counts['ADMK+'], color: '#00ff00' },
            { name: tamilTranslations.Others, value: counts['Others'], color: '#8884d8' }
        ];
    }, [winners]);

    const voteShare = useMemo(() => {
        // Total votes per party
        const partyVotes: Record<string, number> = {};
        let totalTotalVotes = 0;

        data.forEach(d => {
            if (d.Votes) {
                partyVotes[d.Party] = (partyVotes[d.Party] || 0) + d.Votes;
                totalTotalVotes += d.Votes;
            }
        });

        return Object.entries(partyVotes)
            .map(([name, value]) => ({
                name,
                nameTA: partyTranslations[name] || name,
                value: parseFloat(((value / totalTotalVotes) * 100).toFixed(2))
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8 parties
    }, [data]);

    return (
        <div className="space-y-8 p-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-red-50 p-6 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-gray-500 text-sm font-semibold">{tamilTranslations.SeatShare} - {partyTranslations.DMK}</h3>
                    <p className="text-3xl font-bold text-red-600">
                        {partyWins.find(p => p.name === 'DMK')?.value || 0}
                    </p>
                </div>
                <div className="bg-green-50 p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-semibold">{tamilTranslations.SeatShare} - {partyTranslations.ADMK}</h3>
                    <p className="text-3xl font-bold text-green-600">
                        {partyWins.find(p => p.name === 'ADMK')?.value || 0}
                    </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-semibold">{tamilTranslations.AllianceShare} - {tamilTranslations.DMKAlliance}</h3>
                    <p className="text-3xl font-bold text-blue-600">
                        {allianceWins.find(a => a.name === tamilTranslations.DMKAlliance)?.value || 0}
                    </p>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg shadow border-l-4 border-orange-500">
                    <h3 className="text-gray-500 text-sm font-semibold">{tamilTranslations.AllianceShare} - {tamilTranslations.ADMKAlliance}</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        {allianceWins.find(a => a.name === tamilTranslations.ADMKAlliance)?.value || 0}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Seat Share Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">{tamilTranslations.SeatShare} (கூட்டணி வாரியாக)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={allianceWins}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {allianceWins.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vote Share Chart */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">{tamilTranslations.Vote_Share_Percentage} (முக்கிய கட்சிகள்)</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={voteShare}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nameTA" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#82ca9d">
                                    {voteShare.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={partyColors[entry.name] || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Party Wins Table */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-bold mb-4 text-gray-800">{tamilTranslations.SeatsWon} (கட்சி வாரியாக)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {partyWins.map((p) => (
                        <div key={p.name} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="font-medium text-gray-700">{p.nameTA}</span>
                            <span className="font-bold text-gray-900 bg-white px-2 py-1 rounded shadow-sm">{p.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Advanced Visuals Section */}
            <AdvancedVisuals data={data} />
        </div>
    );
};

export default Dashboard;
