import React, { useState, useMemo } from 'react';
import type { ElectionResult } from '../types/election';
import { tamilTranslations, partyColors } from '../data/translations';
import { Search, ArrowUpDown, Filter, X, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface MasterSheetProps {
    data: ElectionResult[];
}

type SortKey = keyof ElectionResult;
type SortDirection = 'asc' | 'desc';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const MasterSheet: React.FC<MasterSheetProps> = ({ data }) => {
    // Search
    const [searchTerm, setSearchTerm] = useState('');
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Filters
    const [constituencyType, setConstituencyType] = useState<string>('All');
    const [ageRange, setAgeRange] = useState<string>('All');
    const [selectedYear, setSelectedYear] = useState<string>('All');

    // New Filters
    const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
    const [selectedConstituency, setSelectedConstituency] = useState<string>('All');
    const [selectedParty, setSelectedParty] = useState<string>('All');
    const [selectedPosition, setSelectedPosition] = useState<string>('All');
    const [selectedGender, setSelectedGender] = useState<string>('All');
    const [marginRange, setMarginRange] = useState<string>('All');
    const [voteShareRange, setVoteShareRange] = useState<string>('All');
    const [selectedAlliance, setSelectedAlliance] = useState<string>('All');
    const [voteCountRange, setVoteCountRange] = useState<string>('All');
    const [winnersOnly, setWinnersOnly] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('All'); // Incumbent, Turncoat, Recontest
    const [selectedEducation, setSelectedEducation] = useState<string>('All');

    // Sorting
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

    // Derived Lists for Dropdowns
    // Extract unique values for filters (now using Tamil fields)
    const districts = useMemo(() => Array.from(new Set(data.map(item => item.District_Name_TA || item.District_Name))).sort(), [data]);

    const constituencies = useMemo(() => {
        let filtered = data;
        if (selectedDistrict !== 'All') {
            filtered = filtered.filter(item => (item.District_Name_TA || item.District_Name) === selectedDistrict);
        }
        return Array.from(new Set(filtered.map(item => item.Constituency_Name_TA || item.Constituency_Name))).sort();
    }, [data, selectedDistrict]);

    const parties = useMemo(() => Array.from(new Set(data.map(item => item.Party_TA || item.Party))).sort(), [data]);

    const educationLevels = useMemo(() => Array.from(new Set(data.map(item => item.MyNeta_education_TA || item.MyNeta_education))).filter(Boolean).sort(), [data]);

    // Years
    const years = useMemo(() => Array.from(new Set(data.map(d => d.Year))).sort(), [data]);

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const processedData = useMemo(() => {
        let result = data;

        // 1. Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter((item) =>
                item.Constituency_Name?.toLowerCase().includes(lowerTerm) ||
                item.Candidate?.toLowerCase().includes(lowerTerm) ||
                item.Party?.toLowerCase().includes(lowerTerm) ||
                item.District_Name?.toLowerCase().includes(lowerTerm) ||
                item.Constituency_Name_TA?.toLowerCase().includes(lowerTerm) ||
                item.Party_TA?.toLowerCase().includes(lowerTerm) ||
                item.District_Name_TA?.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Filters
        if (selectedDistrict !== 'All') {
            result = result.filter(item => (item.District_Name_TA || item.District_Name) === selectedDistrict);
        }

        if (selectedConstituency !== 'All') {
            result = result.filter(item => (item.Constituency_Name_TA || item.Constituency_Name) === selectedConstituency);
        }

        if (selectedParty !== 'All') {
            result = result.filter(item => (item.Party_TA || item.Party) === selectedParty);
        }

        if (selectedPosition !== 'All') {
            if (selectedPosition === 'DepositLost') {
                result = result.filter(item => item.Vote_Share_Percentage < 16.66);
            } else {
                result = result.filter(item => item.Position === parseInt(selectedPosition));
            }
        }

        if (constituencyType !== 'All') {
            result = result.filter(item => item.Constituency_Type === constituencyType);
        }

        if (selectedYear !== 'All') {
            result = result.filter(item => item.Year.toString() === selectedYear);
        }

        if (ageRange !== 'All') {
            result = result.filter(item => {
                const age = item.Age;
                if (!age) return false;
                if (ageRange === '25-40') return age >= 25 && age <= 40;
                if (ageRange === '41-60') return age >= 41 && age <= 60;
                if (ageRange === '61+') return age > 60;
                return true;
            });
        }

        if (selectedGender !== 'All') {
            result = result.filter(item => item.Sex === selectedGender);
        }

        if (marginRange !== 'All') {
            result = result.filter(item => {
                const margin = item.Margin;
                if (!margin) return false;
                if (marginRange === 'High') return margin > 50000;
                if (marginRange === 'Medium') return margin >= 10000 && margin <= 50000;
                if (marginRange === 'Low') return margin < 10000;
                return true;
            });
        }

        if (voteShareRange !== 'All') {
            result = result.filter(item => {
                const share = item.Vote_Share_Percentage;
                if (!share) return false;
                if (voteShareRange === 'High') return share > 50;
                if (voteShareRange === 'Medium') return share >= 30 && share <= 50;
                if (voteShareRange === 'Low') return share < 30;
                return true;
            });
        }

        // New Filters Logic for Alliance
        if (selectedAlliance !== 'All') {
            result = result.filter(item => {
                const party = item.Party ? item.Party.trim() : '';
                if (selectedAlliance === 'DMK+') {
                    return ['DMK', 'INC', 'VCK', 'CPI', 'CPM', 'CPI(M)', 'IUML', 'KMDK', 'MDMK', 'MMK'].includes(party);
                }
                if (selectedAlliance === 'ADMK+') {
                    return ['ADMK', 'BJP', 'PMK', 'TMC', 'TMC(M)', 'AMMK', 'AIADMK'].includes(party);
                }
                if (selectedAlliance === 'Others') {
                    return !['DMK', 'INC', 'VCK', 'CPI', 'CPM', 'CPI(M)', 'IUML', 'KMDK', 'MDMK', 'MMK', 'ADMK', 'BJP', 'PMK', 'TMC', 'TMC(M)', 'AMMK', 'AIADMK'].includes(party);
                }
                return true;
            });
        }

        if (voteCountRange !== 'All') {
            result = result.filter(item => {
                const votes = item.Votes;
                if (!votes) return false;
                if (voteCountRange === '>1L') return votes > 100000;
                if (voteCountRange === '50k-1L') return votes >= 50000 && votes <= 100000;
                if (voteCountRange === '10k-50k') return votes >= 10000 && votes <= 50000;
                if (voteCountRange === '<10k') return votes < 10000;
                return true;
            });
        }

        if (selectedCategory !== 'All') {
            result = result.filter(item => {
                const isTrue = (val: any) => val === true || val === 1 || String(val).toLowerCase() === 'true';

                if (selectedCategory === 'Incumbent') return isTrue(item.Incumbent);
                if (selectedCategory === 'Turncoat') return isTrue(item.Turncoat);
                if (selectedCategory === 'Recontest') return isTrue(item.Recontest);
                return true;
            });
        }

        if (selectedEducation !== 'All') {
            result = result.filter(item => (item.MyNeta_education_TA || item.MyNeta_education) === selectedEducation);
        }

        // Keep winners only checkbox logic as an override/addition
        if (winnersOnly) {
            result = result.filter(item => item.Position === 1);
        }

        // 3. Sorting
        if (sortConfig) {
            result = [...result].sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === bValue) return 0;
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }

                return sortConfig.direction === 'asc'
                    ? String(aValue).localeCompare(String(bValue))
                    : String(bValue).localeCompare(String(aValue));
            });
        }

        return result;
    }, [data, searchTerm, selectedDistrict, selectedConstituency, selectedParty, selectedPosition, constituencyType, ageRange, selectedYear, selectedGender, marginRange, voteShareRange, winnersOnly, sortConfig, selectedCategory, selectedEducation, voteCountRange, selectedAlliance]);

    // Derived Data for Visuals
    const statsData = useMemo(() => {
        const total = processedData.length;
        if (total === 0) return null;

        const winners = processedData.filter(d => d.Position === 1);

        // Success Rate by Category
        const incidents = data.filter(d => d.Incumbent).length;
        const incumbentWins = data.filter(d => d.Incumbent && d.Position === 1).length;

        const turncoats = data.filter(d => d.Turncoat).length;
        const turncoatWins = data.filter(d => d.Turncoat && d.Position === 1).length;

        const recontests = data.filter(d => d.Recontest).length;
        const recontestWins = data.filter(d => d.Recontest && d.Position === 1).length;

        const categoryData = [
            { name: 'Incumbents', rate: incidents ? Math.round((incumbentWins / incidents) * 100) : 0, total: incidents, wins: incumbentWins },
            { name: 'Turncoats', rate: turncoats ? Math.round((turncoatWins / turncoats) * 100) : 0, total: turncoats, wins: turncoatWins },
            { name: 'Recontesting', rate: recontests ? Math.round((recontestWins / recontests) * 100) : 0, total: recontests, wins: recontestWins }
        ];

        // Education breakdown of filtered winners (or candidates if no winners)
        const eduStats: Record<string, number> = {};
        (winners.length > 0 ? winners : processedData).forEach(d => {
            const edu = d.MyNeta_education_TA || d.MyNeta_education || 'Unknown';
            eduStats[edu] = (eduStats[edu] || 0) + 1;
        });

        const eduData = Object.entries(eduStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return { categoryData, eduData };
    }, [data, processedData]);


    const totalPages = Math.ceil(processedData.length / itemsPerPage);
    const currentData = processedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const columns: SortKey[] = [

        'Constituency_Name',
        'Constituency_Type',
        'District_Name',
        'Candidate',
        'Sex',
        'Age',
        'MyNeta_education',
        'TCPD_Prof_Main',
        'Party',
        'Votes',
        'N_Cand',
        'Electors',
        'Turnout_Percentage',
        'Vote_Share_Percentage',
        'Margin',
        'Margin_Percentage',
        'Contested',
        'No_Terms',
        'Deposit_Lost',
        'Sub_Region',
        'Position',
        'Year',
    ];

    const getPartyStyle = (party: string) => {
        const color = partyColors[party] || '#808080';
        return {
            backgroundColor: color + '20',
            color: color,
            borderColor: color,
            borderWidth: '1px'
        };
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-lg space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {tamilTranslations.MasterSheet}
                    <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {processedData.length}
                    </span>
                </h2>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={tamilTranslations.Search}
                            className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Filters Grid */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 text-gray-700 font-bold mb-3 border-b pb-2">
                    <Filter className="w-4 h-4" />
                    {tamilTranslations.FilterBy}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* Primary Filters */}
                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedDistrict}
                        onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSelectedConstituency('All'); // Reset constituency when district changes
                        }}
                    >
                        <option value="All">{tamilTranslations.SelectDistrict}</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedConstituency}
                        onChange={(e) => setSelectedConstituency(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectConstituency}</option>
                        {constituencies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedParty}
                        onChange={(e) => setSelectedParty(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectParty}</option>
                        {parties.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectPosition}</option>
                        <option value="1">{tamilTranslations.Position1}</option>
                        <option value="2">{tamilTranslations.Position2}</option>
                        <option value="3">{tamilTranslations.Position3}</option>
                        <option value="DepositLost">{tamilTranslations.DepositLost}</option>
                    </select>

                    {/* Secondary Filters */}
                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={constituencyType}
                        onChange={(e) => setConstituencyType(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.All} {tamilTranslations.ConstituencyType}</option>
                        <option value="GEN">{tamilTranslations.GEN}</option>
                        <option value="SC">{tamilTranslations.SC}</option>
                        <option value="ST">{tamilTranslations.ST}</option>
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.All} {tamilTranslations.Age}</option>
                        <option value="25-40">25 - 40</option>
                        <option value="41-60">41 - 60</option>
                        <option value="61+">60+</option>
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectGender}</option>
                        <option value="M">{tamilTranslations.Male}</option>
                        <option value="F">{tamilTranslations.Female}</option>
                    </select>

                    <div className="flex gap-2">
                        <select
                            className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm w-full"
                            value={marginRange}
                            onChange={(e) => setMarginRange(e.target.value)}
                        >
                            <option value="All">{tamilTranslations.SelectMargin}</option>
                            <option value="High">{tamilTranslations.MarginHigh}</option>
                            <option value="Medium">{tamilTranslations.MarginMedium}</option>
                            <option value="Low">{tamilTranslations.MarginLow}</option>
                        </select>
                    </div>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedAlliance}
                        onChange={(e) => setSelectedAlliance(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectAlliance}</option>
                        <option value="DMK+">{tamilTranslations.DMKAlliance}</option>
                        <option value="ADMK+">{tamilTranslations.ADMKAlliance}</option>
                        <option value="Others">{tamilTranslations.Others}</option>
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={voteCountRange}
                        onChange={(e) => setVoteCountRange(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectVoteCount}</option>
                        <option value=">1L">{tamilTranslations.Votesgt1L}</option>
                        <option value="50k-1L">{tamilTranslations.Votes50kto1L}</option>
                        <option value="10k-50k">{tamilTranslations.Votes10kto50k}</option>
                        <option value="<10k">{tamilTranslations.Voteslt10k}</option>
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="All">Candidate Category</option>
                        <option value="Incumbent">Incumbents (Sitting MLAs)</option>
                        <option value="Turncoat">Turncoats (Party Hoppers)</option>
                        <option value="Recontest">Recontesting Candidates</option>
                    </select>

                    <select
                        className="p-2 border rounded hover:border-blue-500 focus:outline-none bg-white text-sm"
                        value={selectedEducation}
                        onChange={(e) => setSelectedEducation(e.target.value)}
                    >
                        <option value="All">Education Level</option>
                        {educationLevels.map(edu => <option key={edu} value={edu}>{edu}</option>)}
                    </select>
                </div>

                <div className="flex justify-end mt-4 pt-2 border-t border-gray-200">
                    <button
                        onClick={() => {
                            setSelectedDistrict('All');
                            setSelectedConstituency('All');
                            setSelectedParty('All');
                            setSelectedPosition('All');
                            setConstituencyType('All');
                            setAgeRange('All');
                            setSelectedYear('All');
                            setSelectedGender('All');
                            setMarginRange('All');
                            setVoteShareRange('All');
                            setSelectedAlliance('All');
                            setVoteCountRange('All');
                            setSelectedCategory('All');
                            setSelectedEducation('All');
                            setWinnersOnly(false);
                            setSearchTerm('');
                        }}
                        className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <X className="w-4 h-4" />
                        {tamilTranslations.Reset}
                    </button>
                </div>
            </div>

            {/* Visual Summary Section */}
            {processedData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* 1. Party Wise Count in Current Selection */}
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Party Performance</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {Object.entries(
                                processedData.reduce((acc, curr) => {
                                    if (curr.Position === 1) acc[curr.Party] = (acc[curr.Party] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            )
                                .sort(([, a], [, b]) => b - a)
                                .map(([party, count]) => (
                                    <div key={party} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: partyColors[party] || '#gray' }}
                                            />
                                            <span>{party}</span>
                                        </div>
                                        <span className="font-bold">{count} Wins</span>
                                    </div>
                                ))}
                            {processedData.filter(d => d.Position === 1).length === 0 && <span className="text-xs text-gray-400">No winners in filter</span>}
                        </div>
                    </div>

                    {/* 2. Vote Share Distribution */}
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Vote Share Analysis</h4>
                        <div className="flex items-end gap-2 h-24 pb-2">
                            {['>50%', '30-50%', '16-30%', '<16%'].map((label, idx) => {
                                const count = processedData.filter(d => {
                                    if (idx === 0) return d.Vote_Share_Percentage > 50;
                                    if (idx === 1) return d.Vote_Share_Percentage >= 30 && d.Vote_Share_Percentage <= 50;
                                    if (idx === 2) return d.Vote_Share_Percentage >= 16.66 && d.Vote_Share_Percentage < 30;
                                    return d.Vote_Share_Percentage < 16.66;
                                }).length;
                                const height = (count / processedData.length) * 100;
                                return (
                                    <div key={label} className="flex-1 flex flex-col items-center justify-end h-full gap-1 group relative">
                                        <div
                                            className={`w-full rounded-t transition-all hover:opacity-80 ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : idx === 2 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}
                                            style={{ height: `${height || 1}%` }}
                                        />
                                        <span className="text-[10px] text-gray-500 font-medium">{label}</span>
                                        <div className="absolute -top-6 bg-black text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {count}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 3. Key Stats */}
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2">Key Insights</h4>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-blue-50 p-2 rounded">
                                <div className="text-gray-500">Total Valid Votes</div>
                                <div className="text-lg font-bold text-blue-700">
                                    {(processedData.reduce((acc, curr) => acc + curr.Votes, 0) / 1000000).toFixed(2)}M
                                </div>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                                <div className="text-gray-500">Avg Win Margin</div>
                                <div className="text-lg font-bold text-green-700">
                                    {(processedData
                                        .filter(d => d.Position === 1 && d.Margin)
                                        .reduce((acc, curr) => acc + (curr.Margin || 0), 0) /
                                        Math.max(1, processedData.filter(d => d.Position === 1).length)
                                    ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            </div>
                            <div className="bg-yellow-50 p-2 rounded">
                                <div className="text-gray-500">Candidates</div>
                                <div className="text-lg font-bold text-yellow-700">
                                    {processedData.length}
                                </div>
                            </div>
                            <div className="bg-purple-50 p-2 rounded">
                                <div className="text-gray-500">Deposit Lost</div>
                                <div className="text-lg font-bold text-purple-700">
                                    {processedData.filter(d => d.Vote_Share_Percentage < 16.66).length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Insights Section */}
            {statsData && selectedCategory === 'All' && selectedEducation === 'All' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" /> Success Rates (Win %)
                        </h4>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statsData.categoryData} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis dataKey="name" type="category" width={80} style={{ fontSize: '11px', fontWeight: 'bold' }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="rate" name="Win %" fill="#8884d8" barSize={20} radius={[0, 4, 4, 0]}>
                                        <Cell fill="#3b82f6" />
                                        <Cell fill="#f97316" />
                                        <Cell fill="#a855f7" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-500" /> Education Profile (Top 5)
                        </h4>
                        <div className="h-48 flex items-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statsData.eduData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statsData.eduData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}


            {/* Data Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full bg-white text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col}
                                    className="px-6 py-3 text-left font-semibold text-gray-700 border-b cursor-pointer hover:bg-gray-200 transition-colors select-none whitespace-nowrap"
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="flex items-center gap-1">
                                        {tamilTranslations[col] || col}
                                        <ArrowUpDown className={`w-3 h-3 ${sortConfig?.key === col ? 'text-blue-600 opacity-100' : 'opacity-30'}`} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentData.length > 0 ? (
                            currentData.map((row, index) => (
                                <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900 w-[200px]">
                                        {row.Constituency_Name_TA || row.Constituency_Name}
                                        <div className="text-xs text-gray-500">{row.Constituency_Type === 'SC' ? tamilTranslations.SC : row.Constituency_Type === 'ST' ? tamilTranslations.ST : tamilTranslations.GEN}</div>
                                    </td>
                                    <td className="px-6 py-3">{row.District_Name_TA || row.District_Name}</td>
                                    <td className="px-6 py-3 font-medium">
                                        <div className="flex flex-col">
                                            <span>{row.Candidate}</span>
                                            <div className="flex gap-1 mt-1">
                                                {row.Incumbent && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">Incumbent</span>}
                                                {row.Turncoat && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">Turncoat</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${row.Sex === 'M' ? 'bg-blue-50 text-blue-600' : row.Sex === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-gray-50 text-gray-600'}`}>
                                            {row.Sex_TA || row.Sex}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">{row.Age}</td>
                                    <td className="px-6 py-3 text-xs text-gray-600 max-w-[150px] truncate" title={row.MyNeta_education_TA || row.MyNeta_education}>
                                        {row.MyNeta_education_TA || row.MyNeta_education || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-600 max-w-[150px] truncate" title={row.TCPD_Prof_Main_TA || row.TCPD_Prof_Main}>
                                        {row.TCPD_Prof_Main_TA || row.TCPD_Prof_Main || '-'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span
                                            className="px-2 py-1 rounded font-bold text-xs inline-block min-w-[60px] text-center"
                                            style={getPartyStyle(row.Party)}
                                        >
                                            {row.Party_TA || row.Party}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 font-mono">
                                        <div className="flex flex-col gap-1">
                                            <span>{row.Votes?.toLocaleString()}</span>
                                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min((row.Votes / 150000) * 100, 100)}%` }} // Max assumed 1.5L for scale
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-mono">
                                        <div className="flex items-center gap-2">
                                            <span className="w-12 text-right">{row.Vote_Share_Percentage?.toFixed(2)}%</span>
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${row.Vote_Share_Percentage > 50 ? 'bg-green-500' :
                                                        row.Vote_Share_Percentage > 30 ? 'bg-blue-500' :
                                                            row.Vote_Share_Percentage > 16.66 ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${row.Vote_Share_Percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-center text-gray-600">
                                        {row.N_Cand}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-gray-500">
                                        {row.Electors?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-gray-600 text-center">
                                        {row.Turnout_Percentage ? `${row.Turnout_Percentage}%` : '-'}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-gray-600 text-center">
                                        {row.Vote_Share_Percentage?.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-3 font-mono text-gray-500">
                                        {row.Margin ? (
                                            <div>
                                                {row.Margin.toLocaleString()}
                                                <span className="text-[10px] text-gray-400 block">
                                                    {(row.Margin > 10000 ? 'Safe Lead' : row.Margin > 1000 ? 'Close' : 'Tight Fight')}
                                                </span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-gray-500">
                                        {row.Margin_Percentage ? `${row.Margin_Percentage.toFixed(2)}%` : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-center text-xs text-gray-600">
                                        {row.Contested ? (
                                            <span className="bg-gray-100 px-2 py-1 rounded">
                                                {row.Contested}x
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-center text-xs text-gray-600">
                                        {row.No_Terms ? (
                                            <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-bold">
                                                {row.No_Terms} Wins
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        {row.Deposit_Lost === 'yes' ? (
                                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200 uppercase font-bold">
                                                Lost
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded border border-green-200 uppercase">
                                                Saved
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-500">
                                        {row.Sub_Region}
                                    </td>
                                    <td className="px-6 py-3 font-bold">
                                        <span className={`w-6 h-6 flex items-center justify-center rounded-full ${row.Position === 1 ? 'bg-yellow-100 text-yellow-700' : 'text-gray-500'}`}>
                                            {row.Position}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-400">{row.Year}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                                    No results found for your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-2 border-t">
                <button
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <div className="flex gap-2 items-center">
                    <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                </div>
                <button
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default MasterSheet;
