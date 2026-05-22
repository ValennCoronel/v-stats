import { BrowserRouter as Router, Routes, Route } from 'react-router';
import { ProfileProvider } from './context/ProfileContext';
import LoginScreen from './components/screens/LoginScreen';
import HomeScreen from './components/screens/HomeScreen';
import TeamMatchesScreen from './components/screens/TeamMatchesScreen';
import LiveMatchScreen from './components/screens/LiveMatchScreen';
import StatsScreen from './components/screens/StatsScreen';
import ConfigScreen from './components/screens/ConfigScreen';

export default function App() {
  return (
    <ProfileProvider>
      <Router>
        <div className="size-full bg-[#F4F7FB] overflow-auto">
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/team/:teamId" element={<TeamMatchesScreen />} />
            <Route path="/match/:matchId" element={<LiveMatchScreen />} />
            <Route path="/stats/:matchId" element={<StatsScreen />} />
            <Route path="/config" element={<ConfigScreen />} />
          </Routes>
        </div>
      </Router>
    </ProfileProvider>
  );
}