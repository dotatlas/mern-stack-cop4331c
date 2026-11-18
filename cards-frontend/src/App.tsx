import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import VerifyEmailPage from './VerifyEmailPage';
import ResetPasswordPage from './ResetPasswordPage';
import NotificationTest from './NotificationTest';

function App() {
  return (
    <Router>
      <Routes>
        {/* On initial access, render the Login page */}
        <Route path="/" element={<LoginPage />} />
        
        {/* Main interactive application page on successful login */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Email verification */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/*test for browse nofications*/}
        <Route path="/notification-test" element={<NotificationTest />} />

        {/* Catch-all redirects back to login */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;