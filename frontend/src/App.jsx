import {
  BrowserRouter,
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import AppProvider from "./state/AppProvider";
import { useApp } from "./state/context";
import Layout from "./components/Layout";
import { Button, Empty, ErrorMessage } from "./components/UI";
import Catalog from "./pages/Catalog";
import Auth from "./pages/Auth";
import Applications from "./pages/Applications";
import Profile from "./pages/Profile";
import ShiftDetail from "./pages/ShiftDetail";
import CompanyDashboard, { CompanyProfile } from "./pages/Company";
import CompanyShifts from "./pages/CompanyShifts";
import ShiftEditor from "./pages/ShiftEditor";
import Candidates from "./pages/Candidates";
import Admin from "./pages/Admin";
import "./App.css";

function AccountGuard({ company = false, admin = false }) {
  const { user, loading, error, refresh, company: ownCompany } = useApp();
  const location = useLocation();
  if (loading)
    return (
      <div className="page-loader">
        <span className="loader" />
        <p>Готовим ваше пространство…</p>
      </div>
    );
  if (error)
    return (
      <div className="connection-error">
        <ErrorMessage message={error} />
        <Button onClick={() => refresh()}>Попробовать снова</Button>
      </div>
    );
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (company && !ownCompany) return <Navigate to="/company/create" replace />;
  if (admin && user.role !== "admin") return <Empty title="Нет доступа" text="Этот раздел доступен только администраторам сервиса."><Link to="/" className="btn btn-primary">К вакансиям</Link></Empty>;
  return <Outlet />;
}

function CompanyCreate() {
  const { company } = useApp();
  return company ? (
    <Navigate to="/company" replace />
  ) : (
    <CompanyProfile creating />
  );
}

function NotFound() {
  return (
    <Empty
      title="Кажется, мы свернули не туда"
      text="Такой страницы нет. Но в каталоге ещё много возможностей."
    >
      <Link to="/" className="btn btn-primary">
        К поиску смен
      </Link>
    </Empty>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth register />} />
          <Route element={<Layout />}>
            <Route index element={<Catalog />} />
            <Route path="/saved" element={<Catalog favorites />} />
            <Route path="/shifts/:id" element={<ShiftDetail />} />
            <Route element={<AccountGuard />}>
              <Route path="/applications" element={<Applications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/company/create" element={<CompanyCreate />} />
              <Route element={<AccountGuard admin />}><Route path="/admin" element={<Admin />} /></Route>
              <Route element={<AccountGuard company />}>
                <Route path="/company" element={<CompanyDashboard />} />
                <Route path="/company/profile" element={<CompanyProfile />} />
                <Route path="/company/shifts" element={<CompanyShifts />} />
                <Route path="/company/shifts/new" element={<ShiftEditor />} />
                <Route
                  path="/company/shifts/:id/edit"
                  element={<ShiftEditor />}
                />
                <Route path="/company/candidates" element={<Candidates />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
