
import React, { useMemo } from 'react';
import type { ElectionResult } from '../types/election';
import { tamilTranslations, partyColors } from '../data/translations';
import { partyTranslations, educationTranslations, professionTranslations } from '../data/tamilData';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter, PieChart, Pie, Cell,
    AreaChart, Area, ComposedChart, Line
} from 'recharts';

interface AdvancedVisualsProps {
    data: ElectionResult[];
}

const AdvancedVisuals: React.FC<AdvancedVisualsProps> = ({ data }) => {
    const winners = useMemo(() => data.filter(d => d.Position === 1), [data]);

    // 1. District-wise Party Performance (Stacked Bar)
    const districtData = useMemo(() => {
        const distMap: Record<string, any> = {};
        const parties = new Set<string>();

        winners.forEach(w => {
            if (!distMap[w.District_Name]) {
                distMap[w.District_Name] = { name: w.District_Name };
            }
            distMap[w.District_Name][w.Party] = (distMap[w.District_Name][w.Party] || 0) + 1;
            parties.add(w.Party);
        });

        return {
            data: Object.values(distMap).slice(0, 15), // Top 15 districts for readability
            parties: Array.from(parties)
        };
    }, [winners]);

    // 2. Victory Margins (Scatter/Area)
    const marginData = useMemo(() => {
        return winners
            .map(w => ({
                name: w.Constituency_Name_TA || w.Constituency_Name,
                margin: w.Margin,
                party: w.Party_TA || w.Party,
                size: 100 // bubble size
            }))
            .sort((a, b) => b.margin - a.margin)
            .slice(0, 50); // Top 50 margins
    }, [winners]);

    // 3. Strike Rate (Wins vs Contested)
    const strikeRateData = useMemo(() => {
        const stats: Record<string, { contested: number, won: number }> = {};

        data.forEach(d => {
            // Assuming unique candidate entries per constituency
            if (!stats[d.Party]) stats[d.Party] = { contested: 0, won: 0 };
            stats[d.Party].contested++;
            if (d.Position === 1) stats[d.Party].won++;
        });

        return Object.entries(stats)
            .filter(([_, val]) => val.contested > 10) // Only major parties
            .map(([party, val]) => ({
                name: partyTranslations[party] || party,
                winRate: parseFloat(((val.won / val.contested) * 100).toFixed(1)),
                contested: val.contested,
                won: val.won
            }))
            .sort((a, b) => b.winRate - a.winRate);
    }, [data]);

    // 4. Gender Distribution (Pie)
    const genderData = useMemo(() => {
        const counts = { M: 0, F: 0, Others: 0 };
        winners.forEach(w => {
            if (w.Sex === 'M') counts.M++;
            else if (w.Sex === 'F') counts.F++;
            else counts.Others++;
        });
        return [
            { name: tamilTranslations.Male, value: counts.M, color: '#3b82f6' },
            { name: tamilTranslations.Female, value: counts.F, color: '#ec4899' }
        ];
    }, [winners]);

    // 5. Turnout vs Margin (Scatter)
    const turnoutVsMargin = useMemo(() => {
        return winners.map(w => ({
            x: w.Turnout_Percentage,
            y: w.Margin,
            party: w.Party_TA || w.Party,
            constituency: w.Constituency_Name_TA || w.Constituency_Name
        })).filter(d => d.x && d.y);
    }, [winners]);

    // 6. Vote Share vs Seat Share
    const voteVsSeatData = useMemo(() => {
        const totalSeats = 234;
        const totalVotes = data.reduce((sum, d) => sum + d.Votes, 0);

        const stats: Record<string, { votes: number, seats: number }> = {};
        const parties = new Set<string>();

        // Calculate Seats
        winners.forEach(w => {
            if (!stats[w.Party]) stats[w.Party] = { votes: 0, seats: 0 };
            stats[w.Party].seats++;
            parties.add(w.Party);
        });

        // Calculate Votes (using all candidates data)
        data.forEach(d => {
            if (stats[d.Party]) { // Only consider parties that won at least one seat for this chart to keep it clean
                stats[d.Party].votes += d.Votes;
            }
        });

        return Object.entries(stats)
            .map(([party, val]) => ({
                name: party,
                voteShare: parseFloat(((val.votes / totalVotes) * 100).toFixed(2)),
                seatShare: parseFloat(((val.seats / totalSeats) * 100).toFixed(2)),
                conversion: parseFloat(((val.seats / totalSeats) / (val.votes / totalVotes)).toFixed(2)) // Efficiency
            }))
            .sort((a, b) => b.seatShare - a.seatShare);
    }, [data, winners]);

    // 7. Age Analysis
    const ageData = useMemo(() => {
        const stats: Record<string, { totalAge: number, count: number }> = {};

        winners.forEach(w => {
            if (w.Age && w.Age > 20) { // Basic validation
                if (!stats[w.Party]) stats[w.Party] = { totalAge: 0, count: 0 };
                stats[w.Party].totalAge += w.Age;
                stats[w.Party].count++;
            }
        });

        return Object.entries(stats)
            .map(([party, val]) => ({
                name: partyTranslations[party] || party,
                avgAge: parseFloat((val.totalAge / val.count).toFixed(1))
            }))
            .sort((a, b) => b.avgAge - a.avgAge);
    }, [winners]);

    // 8. Closest Fights (Top 6)
    const closestFights = useMemo(() => {
        return [...winners]
            .sort((a, b) => (a.Margin || 0) - (b.Margin || 0))
            .slice(0, 6);
    }, [winners]);

    // 9. Education Analysis
    const educationData = useMemo(() => {
        const stats: Record<string, number> = {};
        winners.forEach(w => {
            const edu = w.MyNeta_education || 'Unknown';
            stats[edu] = (stats[edu] || 0) + 1;
        });

        // Custom sort order for education
        const order = ['Doctorate', 'Post Graduate', 'Graduate Professional', 'Graduate', '12th Pass', '10th Pass', '8th Pass', '5th Pass', 'Literate', 'Others'];

        return Object.entries(stats)
            .map(([name, value]) => ({ name, nameTA: educationTranslations[name] || name, value }))
            .sort((a, b) => {
                const idxA = order.indexOf(a.name);
                const idxB = order.indexOf(b.name);
                // If not found in order, push to end
                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            });
    }, [winners]);

    // 10. Profession Analysis (Top 5)
    const professionData = useMemo(() => {
        const stats: Record<string, number> = {};
        winners.forEach(w => {
            const prof = w.TCPD_Prof_Main || 'Unknown';
            stats[prof] = (stats[prof] || 0) + 1;
        });

        return Object.entries(stats)
            .map(([name, value]) => ({ name, nameTA: professionTranslations[name] || name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [winners]);

    // 11. Reserved Seat Analysis (SC/ST)
    const reservedData = useMemo(() => {
        const scWinners = winners.filter(w => w.Constituency_Type === 'SC' || w.Constituency_Type === 'ST');
        const stats: Record<string, number> = {};

        scWinners.forEach(w => {
            stats[w.Party] = (stats[w.Party] || 0) + 1;
        });

        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [winners]);


    return (
        <div className="space-y-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">📊 Advanced Analytics</h2>

            {/* Row 1: District Analysis & Strike Rate */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">{tamilTranslations.DistrictResults} (Top 15)</h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={districtData.data} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '12px' }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="DMK" stackId="a" fill={partyColors['DMK']} name={partyTranslations['DMK']} />
                                <Bar dataKey="ADMK" stackId="a" fill={partyColors['ADMK']} name={partyTranslations['ADMK']} />
                                <Bar dataKey="INC" stackId="a" fill={partyColors['INC']} name={partyTranslations['INC']} />
                                <Bar dataKey="VCK" stackId="a" fill="#000080" name={partyTranslations['VCK']} />
                                <Bar dataKey="PMK" stackId="a" fill={partyColors['PMK']} name={partyTranslations['PMK']} />
                                <Bar dataKey="BJP" stackId="a" fill={partyColors['BJP']} name={partyTranslations['BJP']} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">{tamilTranslations.StrikeRate}</h3>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={strikeRateData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value: number | undefined) => [`${value ?? 0}%`]} />
                                <Bar dataKey="winRate" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                    {strikeRateData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={partyColors[entry.name] || partyColors[Object.keys(partyTranslations).find(key => partyTranslations[key] === entry.name) || ''] || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 2: Turnout Analysis & Gender */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">{tamilTranslations.TurnoutVsMargin}</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="x" name="Turnout" unit="%" domain={['auto', 'auto']} />
                                <YAxis type="number" dataKey="y" name="Margin" unit=" votes" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Constituencies" data={turnoutVsMargin} fill="#8884d8">
                                    {turnoutVsMargin.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={partyColors[entry.party] || '#999'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">ஒவ்வொரு புள்ளியும் ஒரு தொகுதியை குறிக்கிறது. நிறம் வெற்றி பெற்ற கட்சியை குறிக்கிறது.</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">{tamilTranslations.GenderDist}</h3>
                    <div className="h-64 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[45%] left-0 right-0 text-center">
                            <span className="text-3xl font-bold text-gray-800">{genderData[1].value}</span>
                            <p className="text-xs text-pink-500 font-semibold">பெண்கள் (வெற்றி)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Victory Margins Area */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold mb-4 text-gray-700">{tamilTranslations.VictoryMargin} (போக்குகள்)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={marginData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" hide />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="margin" stroke="#82ca9d" fill="#82ca9d" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-sm text-gray-500 mt-2">தொகுதிகள் அதிக வாக்கு வித்தியாசத்திலிருந்து வரிசைப்படுத்தப்பட்டுள்ளன.</p>
            </div>



            {/* Row 4: Vote vs Seat Share & Age Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">வாக்குகளை இடங்களாக மாற்றும் திறன் (Conversion Efficiency)</h3>
                    <p className="text-xs text-gray-500 mb-4">கட்சிகள் பெற்ற வாக்குகளை எவ்வளவு திறம்பட இடங்களாக மாற்றின என்று காட்டுகிறது (FPTP).</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={voteVsSeatData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" style={{ fontSize: '10px' }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="voteShare" name="வாக்கு %" fill="#8884d8" />
                                <Bar dataKey="seatShare" name="இடங்கள் %" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">வெற்றி பெற்றவர்களின் சராசரி வயது</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ageData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[25, 75]} />
                                <YAxis dataKey="name" type="category" width={60} />
                                <Tooltip />
                                <Bar dataKey="avgAge" name="சராசரி வயது" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                                    {ageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={partyColors[Object.keys(partyTranslations).find(k => partyTranslations[k] === entry.name) || ''] || '#f59e0b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Row 5: Closest Fights Cards */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl shadow-lg border border-indigo-100">
                <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <span className="text-2xl">⚡</span> கடும் போட்டி: மிகக்குறைந்த வாக்கு வித்தியாச வெற்றிகள்
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {closestFights.map((fight, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">{fight.Constituency_Name_TA || fight.Constituency_Name}</span>
                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">
                                    வித்தியாசம்: {fight.Margin}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: partyColors[fight.Party] || '#ccc' }}></div>
                                <div>
                                    <div className="text-sm font-bold text-gray-800">{fight.Candidate}</div>
                                    <div className="text-xs text-gray-500 font-medium">{fight.Party_TA || fight.Party}</div>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
                                <span>வெற்றி வாக்குகள்: {fight.Votes.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


            {/* Row 6: Candidate Demographics */}
            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mt-8">🎓 வேட்பாளர்கள் விவரக்குறிப்பு & பிரதிநிதித்துவம்</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Education Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 lg:col-span-2">
                        <h3 className="text-lg font-bold mb-4 text-gray-700">வெற்றி பெற்றவர்களின் கல்வித் தகுதி</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={educationData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="nameTA" interval={0} tick={{ fontSize: 10 }} height={50} angle={-15} textAnchor="end" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" name="எம்.எல்.ஏக்கள் எண்ணிக்கை" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Profession & Reserved */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-bold mb-4 text-gray-700">முக்கிய தொழில்கள்</h3>
                            <div className="space-y-3">
                                {professionData.map((p, idx) => (
                                    <div key={idx} className="flex flex-col">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{p.nameTA}</span>
                                            <span className="font-bold text-gray-900">{p.value}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-teal-500 h-2 rounded-full"
                                                style={{ width: `${(p.value / winners.length) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                            <h3 className="text-lg font-bold mb-4 text-gray-700">Representation in Reserved Seats (SC/ST)</h3>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={reservedData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {reservedData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={partyColors[entry.name] || '#999'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );

};

export default AdvancedVisuals;
