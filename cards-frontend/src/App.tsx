import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* On initial access, render the Login page */}
        <Route path="/" element={<LoginPage />} />
        
        {/* Main interactive application page on successful login */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Catch-all redirects back to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;