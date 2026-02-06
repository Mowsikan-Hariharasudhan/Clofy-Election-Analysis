import { useEffect, useState } from 'react';
import { parseCSV } from './utils/csvParser';
import type { ElectionResult } from './types/election';
import MasterSheet from './components/MasterSheet';
import ConstituencyMap from './components/ConstituencyMap';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { constituencyTranslations, districtTranslations, partyTranslations, educationTranslations, professionTranslations } from './data/tamilData';
import { tamilTranslations as uiTranslations } from './data/translations';

function App() {
  const [data, setData] = useState<ElectionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'master' | 'map'>('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await parseCSV('/election_data.csv');

        // Enrich data with Tamil translations
        const enrichedData = result.map(item => ({
          ...item,
          Constituency_Name_TA: constituencyTranslations[item.Constituency_Name?.toUpperCase()] || item.Constituency_Name,
          District_Name_TA: districtTranslations[item.District_Name] || item.District_Name,
          Party_TA: partyTranslations[item.Party] || item.Party,
          MyNeta_education_TA: educationTranslations[item.MyNeta_education] || item.MyNeta_education,
          TCPD_Prof_Main_TA: professionTranslations[item.TCPD_Prof_Main] || item.TCPD_Prof_Main,
          Sex_TA: item.Sex === 'M' ? uiTranslations.Male : (item.Sex === 'F' ? uiTranslations.Female : item.Sex)
        }));

        setData(enrichedData);
      } catch (error) {
        console.error("Error parsing CSV:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">{uiTranslations.Loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar currentView={view} setView={setView} />

      <main className="flex-1 container mx-auto px-4 py-8">
        {view === 'dashboard' ? (
          <Dashboard data={data} />
        ) : view === 'master' ? (
          <MasterSheet data={data} />
        ) : (
          <ConstituencyMap data={data} />
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 text-center">
        <p>© 2026 Tamil Nadu Election Analysis. Built with ❤️</p>
      </footer>
    </div>
  );
}

export default App;
