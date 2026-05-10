import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PoliciesPage from './pages/PoliciesPage';
import RequestsPage from './pages/RequestsPage';
import ResourcesPage from './pages/ResourcesPage';
import UsersPage from './pages/UsersPage';
import AccessCheckPage from './pages/AccessCheckPage';
import AuditPage from './pages/AuditPage';
import AttributesPage from './pages/AttributesPage';
import ProfilePage from './pages/ProfilePage';
import CachePage from './pages/CachePage';

const PrivateRoute = ({ children, roles }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                        <Route index element={<Navigate to="/dashboard" />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="policies" element={<PoliciesPage />} />
                        <Route path="resources" element={<ResourcesPage />} />
                        <Route path="requests" element={<RequestsPage />} />
                        <Route path="access-check" element={<AccessCheckPage />} />
                        <Route path="audit" element={<AuditPage />} />
                        <Route path="attributes" element={<AttributesPage />} />
                        <Route path="cache" element={<CachePage />} />
                        <Route path="profile" element={<ProfilePage />} />
                        <Route path="users" element={
                            <PrivateRoute roles={['admin', 'manager']}><UsersPage /></PrivateRoute>
                        } />
                        <Route path="logout" element={<LogoutRedirect />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

function LogoutRedirect() {
    const { logout } = useAuth();
    React.useEffect(() => { logout(); }, [logout]);
    return <Navigate to="/login" />;
}

export default App;
