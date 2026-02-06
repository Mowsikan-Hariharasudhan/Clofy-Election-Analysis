import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { ElectionResult } from '../types/election';
import { tamilTranslations, partyColors } from '../data/translations';
import { partyTranslations } from '../data/tamilData';
import L from 'leaflet';
import { Search, Filter, X } from 'lucide-react';
import { useMap } from 'react-leaflet';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ConstituencyMapProps {
    data: ElectionResult[];
}

// Mapping for GeoJSON name variations to CSV names
const NAME_MAPPING: Record<string, string> = {
    'gummidipoondi': 'gummidipundi',
    'tiruvottiyur': 'thiruvottiyur',
    'arakkonam': 'arakonam',
    'sholingur': 'sholinghur',
    'dr.radhakrishnan naga': 'dr. radhakrishnan nagar',
    'kilvaithinankuppam(sc': 'kilvaithinankuppam',
    'gudiyattam': 'gudiyatham',
    'chepauk-thiruvalliken': 'chepauk-thiruvallikeni',
    'thiyagarayanagar': 'theayagaraya nagar',
    'vaniyambadi': 'vaniayambadi',
    'madurantakam': 'maduranthakam',
    'palacodu': 'palacode',
    'rishivandiyam': 'rishivandiam',
    'viluppuram': 'villupuram',
    'ulundurpettai': 'ulundurpet',
    'edappadi': 'edapadi',
    'tiruchengodu': 'tiruchengode',
    'senthamangalam': 'sendamangalam',
    'mettuppalayam': 'mettupalayam',
    'sirkazhi': 'sirkali',
    'modakkurichi': 'modakurichi',
    'thiruvidaimarudur': 'thiruvidamarudur',
    'coimbatore(north)': 'coimbatore north',
    'coimbatore(south)': 'coimbatore south',
    'udumalaipettai': 'udumalpet',
    'thiruverumbur': 'thiruverambur',
    'orathanadu': 'orathanad',
    'thiruthuraipoondi': 'thiruthuraipundi',
    'nilakkottai': 'nilakottai',
    'aranthangi': 'arantangi',
    'aruppukkottai': 'aruppukottai',
    'mudhukulathur': 'mudukulathur',
    'palayamkottai': 'palayamcottai'
};

const getNormalizedName = (feature: any) => {
    const props = feature.properties;
    let name = props.AC_NAME || props.ac_name;
    const acNo = props.AC_NO || props.ac_no;

    if (!name) return '';

    // Handle Tiruchirappalli special case (split by AC Number)
    // 140: West, 141: East
    if (name.toLowerCase().includes('tiruchirappalli')) {
        if (acNo === 140) return 'tiruchirapalli (west)';
        if (acNo === 141) return 'tiruchirapalli (east)';
    }

    let normalized = name.toLowerCase()
        .replace(/\(sc\)/g, '')
        .replace(/\(st\)/g, '')
        .replace(/\(sc/g, '') // Fix for unclosed brackets
        .trim();

    return NAME_MAPPING[normalized] || normalized;
};

const ConstituencyMap: React.FC<ConstituencyMapProps> = ({ data }) => {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [selectedAlliance, setSelectedAlliance] = useState<string>('All');
    const [selectedParty, setSelectedParty] = useState<string>('All');
    const [marginRange, setMarginRange] = useState<string>('All');
    const [constituencyType, setConstituencyType] = useState<string>('All');
    const [selectedGender, setSelectedGender] = useState<string>('All');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Map Controller Component for zooming
    const MapController = ({ centerCoord, zoomLevel }: { centerCoord: [number, number] | null, zoomLevel: number }) => {
        const map = useMap();
        useEffect(() => {
            if (centerCoord) {
                map.setView(centerCoord, zoomLevel, { animate: true });
            }
        }, [centerCoord, zoomLevel, map]);
        return null;
    };

    const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(7);

    useEffect(() => {
        fetch('/tn_ac_2021.geojson')
            .then(response => response.json())
            .then(data => {
                setGeoJsonData(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error loading map data:", error);
                setLoading(false);
            });
    }, []);



    // Unique Parties & Districts for Dropdown
    const uniqueParties = useMemo(() => Array.from(new Set(data.map(d => d.Party).filter(Boolean))).sort(), [data]);
    const uniqueDistricts = useMemo(() => Array.from(new Set(data.map(d => d.District_Name).filter(Boolean))).sort(), [data]);

    // Filter Logic
    const filteredData = useMemo(() => {
        let result = data;

        // Ensure we only look at winners for the map coloring primarily
        // but user might want to see where a party participated? 
        // For coloring map by winner, we usually take the winner of that constituency.
        // If filters are applied, we might want to gray out constituencies that don't match.

        const winners = result.filter(d => d.Position === 1);

        let filteredWinners = winners;

        if (selectedAlliance !== 'All') {
            filteredWinners = filteredWinners.filter(item => {
                const party = item.Party;
                if (selectedAlliance === 'DMK+') {
                    return ['DMK', 'INC', 'VCK', 'CPI', 'CPM', 'CPI(M)', 'IUML', 'KMDK', 'MDMK', 'MMK'].includes(party);
                }
                if (selectedAlliance === 'ADMK+') {
                    return ['ADMK', 'BJP', 'PMK', 'TMC', 'TMC(M)'].includes(party);
                }
                if (selectedAlliance === 'Others') {
                    return !['DMK', 'INC', 'VCK', 'CPI', 'CPM', 'CPI(M)', 'IUML', 'KMDK', 'MDMK', 'MMK', 'ADMK', 'BJP', 'PMK', 'TMC', 'TMC(M)'].includes(party);
                }
                return true;
            });
        }

        if (selectedParty !== 'All') {
            filteredWinners = filteredWinners.filter(item => item.Party === selectedParty);
        }

        if (marginRange !== 'All') {
            filteredWinners = filteredWinners.filter(item => {
                const margin = item.Margin;
                if (!margin) return false;
                if (marginRange === 'High') return margin > 50000;
                if (marginRange === 'Medium') return margin >= 10000 && margin <= 50000;
                if (marginRange === 'Low') return margin < 10000;
                return true;
            });
        }

        if (constituencyType !== 'All') {
            filteredWinners = filteredWinners.filter(item => item.Constituency_Type === constituencyType);
        }

        if (selectedGender !== 'All') {
            filteredWinners = filteredWinners.filter(item => item.Sex === selectedGender);
        }

        if (selectedDistrict !== 'All') {
            filteredWinners = filteredWinners.filter(item => item.District_Name === selectedDistrict);
        }

        if (searchTerm) {
            filteredWinners = filteredWinners.filter(item =>
                item.Constituency_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.Constituency_Name_TA?.includes(searchTerm)
            );
        }

        return filteredWinners;
    }, [data, selectedAlliance, selectedParty, marginRange, constituencyType, selectedGender, selectedDistrict, searchTerm]);

    // View Mode State
    const [viewMode, setViewMode] = useState<'winner' | 'margin' | 'voteShare' | 'runnerUp' | 'turnout'>('winner');

    // Helper for color scales
    const getColorScale = (value: number, type: 'margin' | 'voteShare' | 'turnout') => {
        if (type === 'margin') {
            return value > 50000 ? '#10b981' : // Green (Safe)
                value > 20000 ? '#3b82f6' : // Blue (Comfortable)
                    value > 5000 ? '#f59e0b' :  // Yellow (Close)
                        '#ef4444';                  // Red (Tight)
        }
        if (type === 'voteShare') {
            return value > 50 ? '#047857' : // Deep Green
                value > 45 ? '#10b981' : // Green
                    value > 40 ? '#3b82f6' : // Blue
                        value > 30 ? '#f59e0b' : // Yellow
                            '#ef4444';               // Red
        }
        if (type === 'turnout') {
            return value > 80 ? '#1e3a8a' : // Deep Blue
                value > 75 ? '#3b82f6' : // Blue
                    value > 70 ? '#60a5fa' : // Light Blue
                        value > 60 ? '#93c5fd' : // Pale Blue
                            '#e2e8f0';               // Gray
        }
        return '#ccc';
    };

    // Create a lookup map for results: Constituency Name -> { winner, runnerUp }
    const resultsMap = useMemo(() => {
        const map = new Map<string, { winner: ElectionResult, runnerUp?: ElectionResult }>();

        filteredData.forEach(winner => {
            // Find runner up from original data
            const runnerUp = data.find(d =>
                d.Constituency_Name === winner.Constituency_Name &&
                d.Position === 2
            );

            // Normalize name: remove (SC)/(ST), trim, lowercase
            const normalizedName = winner.Constituency_Name
                .replace(/\(SC\)/i, '')
                .replace(/\(ST\)/i, '')
                .trim()
                .toLowerCase();

            map.set(normalizedName, { winner, runnerUp });
        });
        return map;
    }, [filteredData, data]);

    const style = (feature: any) => {
        const normalizedAcName = getNormalizedName(feature);
        const dataObj = resultsMap.get(normalizedAcName);

        let fillColor = '#CCCCCC';
        let fillOpacity = 0.7;

        if (dataObj) {
            const { winner, runnerUp } = dataObj;
            if (viewMode === 'winner') {
                fillColor = partyColors[winner.Party] || '#808080';
            } else if (viewMode === 'runnerUp' && runnerUp) {
                fillColor = partyColors[runnerUp.Party] || '#808080';
            } else if (viewMode === 'margin' && winner.Margin) {
                fillColor = getColorScale(winner.Margin, 'margin');
            } else if (viewMode === 'voteShare' && winner.Vote_Share_Percentage) {
                fillColor = getColorScale(winner.Vote_Share_Percentage, 'voteShare');
            } else if (viewMode === 'turnout' && winner.Turnout_Percentage) {
                fillColor = getColorScale(winner.Turnout_Percentage, 'turnout');
            }
        }

        return {
            fillColor,
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: dataObj ? '3' : '1',
            fillOpacity
        };
    };

    const handleFeatureClick = (e: any, feature: any) => {
        const normalizedAcName = getNormalizedName(feature);
        const dataObj = resultsMap.get(normalizedAcName);

        if (dataObj) {
            setMapCenter([e.latlng.lat, e.latlng.lng]);
            setMapZoom(10);
        }
    };

    const onEachFeature = (feature: any, layer: L.Layer) => {
        const acName = feature.properties.AC_NAME || feature.properties.ac_name;
        const normalizedAcName = getNormalizedName(feature);
        const dataObj = resultsMap.get(normalizedAcName);
        const result = dataObj?.winner;

        if (result) {
            layer.bindTooltip(`
                <div class="text-center font-sans">
                    <div class="font-bold text-sm border-b pb-1 mb-1">${result.Constituency_Name_TA || result.Constituency_Name}</div>
                    <div class="text-xs text-gray-500 mb-1">${result.Constituency_Type}</div>
                    <div class="font-bold text-blue-700 text-sm">${result.Candidate}</div>
                    <div class="text-xs font-semibold badge inline-block px-1.5 rounded" style="background-color: ${partyColors[result.Party]}20; color: ${partyColors[result.Party]}">
                        ${result.Party_TA || result.Party}
                    </div>
                    <div class="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-2 text-left bg-gray-50 p-1 rounded">
                        <span class="text-gray-500">${tamilTranslations.Votes}:</span> <span class="font-mono text-right">${result.Votes.toLocaleString()}</span>
                        <span class="text-gray-500">${tamilTranslations.Vote_Share_Percentage}:</span> <span class="font-mono text-right">${result.Vote_Share_Percentage.toFixed(2)}%</span>
                        <span class="text-gray-500">${tamilTranslations.Margin}:</span> <span class="font-mono text-right font-bold ${result.Margin && result.Margin < 5000 ? 'text-red-600' : 'text-green-600'}">${result.Margin?.toLocaleString() || 'N/A'}</span>
                        <span class="text-gray-500">${tamilTranslations.Turnout}:</span> <span class="font-mono text-right">${result.Turnout_Percentage}%</span>
                    </div>
                     ${dataObj?.runnerUp ? `
                        <div class="mt-2 pt-1 border-t border-gray-100 text-[10px] text-gray-500 flex justify-between">
                            <span>${tamilTranslations.RunnerUp}:</span>
                            <span class="font-bold text-gray-700">${partyTranslations[dataObj.runnerUp.Party] || dataObj.runnerUp.Party}</span>
                        </div>
                    ` : ''}
                </div>
            `, {
                permanent: false,
                sticky: true,
                direction: "top",
                className: "custom-tooltip bg-white p-2 rounded-lg shadow-xl border border-gray-100 min-w-[180px]",
                opacity: 1
            });

        } else {
            layer.bindTooltip(`
                <div class="font-bold text-sm">${acName}</div>
                <div class="text-xs text-gray-400">${tamilTranslations.NoData}</div>
            `, {
                className: "bg-white px-2 py-1 rounded shadow text-center"
            });
        }

        // Consolidated Event Listeners
        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 3,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.9
                });
                layer.openTooltip();
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(style(feature)); // Reset style
                layer.closeTooltip();
            },
            click: (e) => handleFeatureClick(e, feature)
        });
    };

    if (loading) {
        return <div className="h-[600px] flex items-center justify-center text-gray-500">Loading Map...</div>;
    }

    if (!geoJsonData) {
        return <div className="h-[600px] flex items-center justify-center text-red-500">Failed to load map data.</div>;
    }

    // Centering on Tamil Nadu approx coordinates
    const center: [number, number] = [11.1271, 78.6569];

    return (
        <div className="bg-white p-4 rounded-lg shadow-lg h-[850px] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 px-2">Constituency Performance Map</h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-100 flex-1">
                    <div className="flex items-center gap-2 relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-2" />
                        <input
                            type="text"
                            placeholder="Search Constituency..."
                            className="pl-8 pr-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 w-32 md:w-40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="h-4 w-px bg-gray-300 mx-1 hidden md:block"></div>

                    <div className="flex items-center gap-2 text-gray-600 font-semibold text-sm hidden md:flex">
                        <Filter className="w-4 h-4" />
                        <span>Filter:</span>
                    </div>

                    <select
                        className="p-1.5 border rounded hover:border-blue-500 focus:outline-none bg-white text-xs md:text-sm max-w-[120px]"
                        value={selectedDistrict}
                        onChange={(e) => setSelectedDistrict(e.target.value)}
                    >
                        <option value="All">District (All)</option>
                        {uniqueDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        className="p-1.5 border rounded hover:border-blue-500 focus:outline-none bg-white text-xs md:text-sm"
                        value={selectedAlliance}
                        onChange={(e) => setSelectedAlliance(e.target.value)}
                    >
                        <option value="All">Alliance</option>
                        <option value="DMK+">DMK+</option>
                        <option value="ADMK+">ADMK+</option>
                        <option value="Others">Others</option>
                    </select>

                    <select
                        className="p-1.5 border rounded hover:border-blue-500 focus:outline-none bg-white text-xs md:text-sm max-w-[150px]"
                        value={selectedParty}
                        onChange={(e) => setSelectedParty(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectParty}</option>
                        {uniqueParties.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>

                    <select
                        className="p-1.5 border rounded hover:border-blue-500 focus:outline-none bg-white text-xs md:text-sm"
                        value={marginRange}
                        onChange={(e) => setMarginRange(e.target.value)}
                    >
                        <option value="All">{tamilTranslations.SelectMargin}</option>
                        <option value="High">{tamilTranslations.MarginHigh}</option>
                        <option value="Medium">{tamilTranslations.MarginMedium}</option>
                        <option value="Low">{tamilTranslations.MarginLow}</option>
                    </select>

                    <select
                        className="p-1.5 border rounded hover:border-blue-500 focus:outline-none bg-white text-xs md:text-sm"
                        value={constituencyType}
                        onChange={(e) => setConstituencyType(e.target.value)}
                    >
                        <option value="All">Type (All)</option>
                        <option value="GEN">GEN</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                    </select>

                    <select
                        className="p-1.5 border rounded hover:border-blue-500 focus:outline-none bg-white text-xs md:text-sm"
                        value={selectedGender}
                        onChange={(e) => setSelectedGender(e.target.value)}
                    >
                        <option value="All">Gender (All)</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>

                    {/* View Mode Switcher */}
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>

                    <select
                        className="p-1.5 border border-indigo-200 rounded hover:border-indigo-500 focus:outline-none bg-indigo-50 text-indigo-700 text-xs md:text-sm font-medium"
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as any)}
                    >
                        <option value="winner">🎨 Winner</option>
                        <option value="runnerUp">🥈 Runner Up</option>
                        <option value="margin">🔥 Margin</option>
                        <option value="voteShare">📊 Vote %</option>
                        <option value="turnout">🗳️ Turnout</option>
                    </select>

                    <button
                        onClick={() => {
                            setSelectedAlliance('All');
                            setSelectedParty('All');
                            setMarginRange('All');
                            setConstituencyType('All');
                            setSelectedGender('All');
                            setSelectedDistrict('All');
                            setSearchTerm('');
                            setViewMode('winner');
                            setMapCenter([11.1271, 78.6569]);
                            setMapZoom(7);
                        }}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors ml-auto"
                        title="Reset Filters"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 relative z-0">
                {/* Summary Overlay Panel */}
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-gray-200 max-w-xs w-full transition-all">
                    <h3 className="text-sm font-bold text-gray-700 border-b pb-2 mb-2 flex justify-between">
                        <span>சுருக்கம் (Summary)</span>
                        <span className="text-indigo-600">{filteredData.length} தொகுதிகள்</span>
                    </h3>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">{tamilTranslations.Total_Votes}</span>
                            <span className="font-mono font-bold">{(filteredData.reduce((acc, curr) => acc + curr.Votes, 0) / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">சராசரி வாக்கு வித்தியாசம்</span>
                            <span className="font-mono font-bold">{(filteredData.reduce((acc, curr) => acc + (curr.Margin || 0), 0) / Math.max(1, filteredData.length)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>

                        {/* Mini Party Breakdown Bar */}
                        <div className="pt-2">
                            <div className="text-[10px] text-gray-500 mb-1">கட்சி வாரியாக</div>
                            <div className="flex h-2 rounded-full overflow-hidden w-full">
                                {Object.entries(filteredData.reduce((acc, curr) => {
                                    acc[curr.Party] = (acc[curr.Party] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 5) // Top 5
                                    .map(([party, count]) => (
                                        <div
                                            key={party}
                                            style={{ width: `${(count / filteredData.length) * 100}%`, backgroundColor: partyColors[party] || '#ccc' }}
                                            title={`${party}: ${count}`}
                                        />
                                    ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                                {Object.entries(filteredData.reduce((acc, curr) => {
                                    acc[curr.Party] = (acc[curr.Party] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>))
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 4)
                                    .map(([party, count]) => (
                                        <div key={party} className="flex items-center gap-1 text-[10px]">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: partyColors[party] || '#ccc' }}></div>
                                            <span className="font-medium">{partyTranslations[party] || party}</span>
                                            <span className="text-gray-500">({count})</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend Panel (Top Left) */}
                <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-xl border border-gray-200 max-w-[200px] w-full transition-all">
                    <h3 className="text-sm font-bold text-gray-700 border-b pb-2 mb-2">விளக்கம் (Legend)</h3>

                    <div className="space-y-2">
                        {viewMode === 'winner' && (
                            <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto">
                                {Object.entries(partyColors).map(([party, color]) => (
                                    <div key={party} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                                        <span className="text-xs font-medium text-gray-700 truncate">{partyTranslations[party] || party}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {viewMode === 'runnerUp' && (
                            <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto">
                                <div className="text-[10px] text-gray-500 mb-1">இரண்டாம் இடம் பிடித்த கட்சி</div>
                                {Object.entries(partyColors).map(([party, color]) => (
                                    <div key={party} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
                                        <span className="text-xs font-medium text-gray-700 truncate">{partyTranslations[party] || party}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {viewMode === 'margin' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#ef4444] rounded flex-shrink-0"></div>
                                    <span>{'< 5000 (கடும் போட்டி)'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#f59e0b] rounded flex-shrink-0"></div>
                                    <span>{'5000 - 20000'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#3b82f6] rounded flex-shrink-0"></div>
                                    <span>{'20000 - 50000'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#10b981] rounded flex-shrink-0"></div>
                                    <span>{'> 50000 (பாதுகாப்பானது)'}</span>
                                </div>
                            </div>
                        )}
                        {viewMode === 'voteShare' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#ef4444] rounded flex-shrink-0"></div>
                                    <span>{'< 30%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#f59e0b] rounded flex-shrink-0"></div>
                                    <span>{'30% - 40%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#3b82f6] rounded flex-shrink-0"></div>
                                    <span>{'40% - 45%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#10b981] rounded flex-shrink-0"></div>
                                    <span>{'45% - 50%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#047857] rounded flex-shrink-0"></div>
                                    <span>{'> 50%'}</span>
                                </div>
                            </div>
                        )}
                        {viewMode === 'turnout' && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#e2e8f0] rounded flex-shrink-0"></div>
                                    <span>{'< 60%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#93c5fd] rounded flex-shrink-0"></div>
                                    <span>{'60% - 70%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#60a5fa] rounded flex-shrink-0"></div>
                                    <span>{'70% - 75%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#3b82f6] rounded flex-shrink-0"></div>
                                    <span>{'75% - 80%'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                                    <div className="w-4 h-4 bg-[#1e3a8a] rounded flex-shrink-0"></div>
                                    <span>{'> 80%'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MapContainer center={center} zoom={7} scrollWheelZoom={true} className="h-full w-full">
                <MapController centerCoord={mapCenter} zoomLevel={mapZoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <GeoJSON
                    key={`${viewMode}-${selectedAlliance}-${selectedParty}-${marginRange}-${constituencyType}-${selectedGender}-${selectedDistrict}-${searchTerm}`}
                    data={geoJsonData}
                    style={style}
                    onEachFeature={onEachFeature}
                />
            </MapContainer>
        </div>
    );
};

export default ConstituencyMap;
