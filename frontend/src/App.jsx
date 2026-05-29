import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceView from './pages/InvoiceView';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Roznamcha from './pages/Roznamcha';
import Salary from './pages/Salary';
import SalaryDetail from './pages/SalaryDetail';
import Reports from './pages/Reports';
import MasterData from './pages/MasterData';
import Settings from './pages/Settings';
import Backup from './pages/Backup';
import LoadingSpinner from './components/LoadingSpinner';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="invoices/new" element={<CreateInvoice />} />
        <Route path="invoices/:id" element={<InvoiceView />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="roznamcha" element={<Roznamcha />} />
        <Route path="salary" element={<Salary />} />
        <Route path="salary/:id" element={<SalaryDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="master-data" element={<MasterData />} />
        <Route path="settings" element={<Settings />} />
        <Route path="backup" element={<Backup />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
