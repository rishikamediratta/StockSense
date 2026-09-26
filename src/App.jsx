import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpFromLine,
  BarChart3,
  Bell,
  Boxes,
  BrainCircuit,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  Filter,
  LayoutDashboard,
  List,
  LogOut,
  MapPin,
  Menu,
  MoreHorizontal,
  Package,
  PackageCheck,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Truck,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  calculateProductIntelligence,
  freeToUseStock,
  generateDashboardInsights,
  queryStockSense,
  totalStock,
} from "./aiEngine.js";

const today = new Date().toISOString().slice(0, 10);
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const seedState = {
  user: { loginId: "manager01", email: "manager@stocksense.local", password: "Stocksense@2026" },
  products: [
    { id: "p1", name: "Desk", sku: "DESK001", category: "Furniture", uom: "Units", reorder: 20, cost: 3000, stocks: { "loc-1": 50, "loc-2": 8 } },
    { id: "p2", name: "Table", sku: "TABLE001", category: "Furniture", uom: "Units", reorder: 15, cost: 3000, stocks: { "loc-1": 50, "loc-2": 12 } },
    { id: "p3", name: "Steel Rod", sku: "ROD001", category: "Raw Material", uom: "Units", reorder: 30, cost: 850, stocks: { "loc-1": 18, "loc-2": 0 } },
    { id: "p4", name: "Office Chair", sku: "CHAIR001", category: "Furniture", uom: "Units", reorder: 12, cost: 1800, stocks: { "loc-1": 6, "loc-2": 4 } },
  ],
  warehouses: [
    { id: "wh-1", name: "Main Warehouse", code: "WH", address: "14 Industrial Estate, Bengaluru" },
    { id: "wh-2", name: "North Warehouse", code: "NW", address: "8 Logistics Park, Pune" },
  ],
  locations: [
    { id: "loc-1", name: "Main Stock", code: "STOCK1", warehouseId: "wh-1" },
    { id: "loc-2", name: "Production Floor", code: "PROD", warehouseId: "wh-1" },
    { id: "loc-3", name: "North Stock", code: "STOCK2", warehouseId: "wh-2" },
  ],
  receipts: [
    { id: "r1", reference: "WH/IN/0001", contact: "Metro Supplies", date: "2026-09-24", status: "Ready", responsible: "manager01", lines: [{ productId: "p3", quantity: 25, locationId: "loc-1" }] },
    { id: "r2", reference: "WH/IN/0002", contact: "Furniture Hub", date: "2026-09-29", status: "Draft", responsible: "manager01", lines: [{ productId: "p4", quantity: 20, locationId: "loc-1" }] },
    { id: "r3", reference: "NW/IN/0003", contact: "Office Works", date: "2026-09-22", status: "Done", responsible: "manager01", lines: [{ productId: "p2", quantity: 10, locationId: "loc-3" }] },
  ],
  deliveries: [
    { id: "d1", reference: "WH/OUT/0001", contact: "Acme Interiors", address: "22 Residency Road, Bengaluru", date: "2026-09-27", status: "Ready", responsible: "manager01", operationType: "Delivery Order", lines: [{ productId: "p1", quantity: 5, locationId: "loc-1" }] },
    { id: "d2", reference: "WH/OUT/0002", contact: "Studio Nine", address: "4 Park Street, Kolkata", date: "2026-09-23", status: "Waiting", responsible: "manager01", operationType: "Delivery Order", lines: [{ productId: "p3", quantity: 30, locationId: "loc-2" }] },
    { id: "d3", reference: "NW/OUT/0003", contact: "Design Co.", address: "19 MG Road, Pune", date: "2026-10-01", status: "Draft", responsible: "manager01", operationType: "Delivery Order", lines: [{ productId: "p2", quantity: 4, locationId: "loc-3" }] },
  ],
  transfers: [],
  adjustments: [],
  ledger: [
    { id: "m1", reference: "WH/IN/0000", type: "Receipt", contact: "Office Works", status: "Done", date: "2026-09-18", from: "Vendor", to: "WH / Main Stock", productId: "p1", quantity: 12, direction: "in" },
    { id: "m2", reference: "WH/OUT/0000", type: "Delivery", contact: "Design Co.", status: "Done", date: "2026-09-19", from: "WH / Main Stock", to: "Customer", productId: "p2", quantity: 6, direction: "out" },
    { id: "m3", reference: "WH/INT/0001", type: "Internal", contact: "Internal Transfer", status: "Done", date: "2026-09-20", from: "WH / Main Stock", to: "WH / Production Floor", productId: "p1", quantity: 4, direction: "internal" },
  ],
};

const clone = (data) => JSON.parse(JSON.stringify(data));
const getStoredState = () => {
  try {
    const saved = localStorage.getItem("stocksense-state");
    return saved ? JSON.parse(saved) : clone(seedState);
  } catch {
    return clone(seedState);
  }
};

function App() {
  const [state, setState] = useState(getStoredState);
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("stocksense-auth") === "true");

  useEffect(() => localStorage.setItem("stocksense-state", JSON.stringify(state)), [state]);
  useEffect(() => {
    if (authenticated) localStorage.setItem("stocksense-auth", "true");
    else localStorage.removeItem("stocksense-auth");
  }, [authenticated]);

  const actions = useMemo(() => ({
    login: () => setAuthenticated(true),
    logout: () => setAuthenticated(false),
    update: (updater) => setState((current) => {
      const next = updater(clone(current));
      return next;
    }),
    reset: () => setState(clone(seedState)),
  }), []);

  return (
    <Routes>
      <Route path="/login" element={<AuthPage type="login" onLogin={actions.login} state={state} />} />
      <Route path="/signup" element={<AuthPage type="signup" onLogin={actions.login} state={state} update={actions.update} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={authenticated ? <AppShell state={state} logout={actions.logout} /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard state={state} />} />
        <Route path="/products" element={<Products state={state} />} />
        <Route path="/products/new" element={<ProductForm state={state} update={actions.update} />} />
        <Route path="/products/:id/edit" element={<ProductForm state={state} update={actions.update} />} />
        <Route path="/stock" element={<Stock state={state} />} />
        <Route path="/operations/receipts" element={<OperationsList kind="receipt" state={state} />} />
        <Route path="/operations/receipts/new" element={<OperationForm kind="receipt" state={state} update={actions.update} />} />
        <Route path="/operations/receipts/:id" element={<OperationDetail kind="receipt" state={state} update={actions.update} />} />
        <Route path="/operations/deliveries" element={<OperationsList kind="delivery" state={state} />} />
        <Route path="/operations/deliveries/new" element={<OperationForm kind="delivery" state={state} update={actions.update} />} />
        <Route path="/operations/deliveries/:id" element={<OperationDetail kind="delivery" state={state} update={actions.update} />} />
        <Route path="/operations/transfers" element={<Transfers state={state} update={actions.update} />} />
        <Route path="/operations/adjustments" element={<Adjustments state={state} update={actions.update} />} />
        <Route path="/move-history" element={<MoveHistory state={state} />} />
        <Route path="/settings/warehouses" element={<Warehouses state={state} update={actions.update} />} />
        <Route path="/settings/locations" element={<Locations state={state} update={actions.update} />} />
        <Route path="/profile" element={<Profile state={state} logout={actions.logout} />} />
      </Route>
      <Route path="*" element={<Navigate to={authenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

function AuthPage({ type, onLogin, state, update }) {
  const navigate = useNavigate();
  const isLogin = type === "login";
  const [form, setForm] = useState({ loginId: "", password: "", confirm: "", email: "" });
  const [error, setError] = useState("");
  const change = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    setError("");
    if (isLogin) {
      if (form.loginId === state.user.loginId && form.password === (state.user.password || "Stocksense@2026")) {
        onLogin();
        navigate("/dashboard");
      } else setError("Invalid Login Id or Password");
      return;
    }
    if (form.loginId.length < 6 || form.loginId.length > 12) return setError("Login Id must contain between 6 and 12 characters.");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z]).{9,}$/.test(form.password)) return setError("Password must be more than 8 characters and contain lowercase, uppercase, and a special character.");
    if (form.password !== form.confirm) return setError("Password confirmation must match.");
    if (!form.email.includes("@")) return setError("Enter a valid Email Id.");
    update((current) => ({ ...current, user: { loginId: form.loginId, email: form.email, password: form.password } }));
    onLogin();
    navigate("/dashboard");
  };
  return (
    <div className="auth-layout">
      <div className="auth-brand-panel">
        <div className="brand-mark large"><Boxes size={28} /></div>
        <p className="eyebrow light">INVENTORY OPERATIONS</p>
        <h1>StockSense</h1>
        <p>Clear stock visibility for every warehouse, location, and move.</p>
        <div className="auth-rule" />
        <span className="auth-caption">Find · Understand · Act</span>
      </div>
      <main className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><div className="brand-mark"><Boxes size={21} /></div><strong>StockSense</strong></div>
          <p className="eyebrow">{isLogin ? "WELCOME BACK" : "GET STARTED"}</p>
          <h2>{isLogin ? "Sign in to your workspace" : "Create your account"}</h2>
          <p className="muted">{isLogin ? "Use your StockSense login details to continue." : "Set up access to your inventory workspace."}</p>
          <form onSubmit={submit} className="auth-form">
            <Field label="Login Id"><input value={form.loginId} onChange={change("loginId")} placeholder="Enter your login id" autoComplete="username" required /></Field>
            {!isLogin && <Field label="Email Id"><input type="email" value={form.email} onChange={change("email")} placeholder="name@company.com" required /></Field>}
            <Field label="Password"><input type="password" value={form.password} onChange={change("password")} placeholder="Enter your password" autoComplete={isLogin ? "current-password" : "new-password"} required /></Field>
            {!isLogin && <Field label="Re-Enter Password"><input type="password" value={form.confirm} onChange={change("confirm")} placeholder="Confirm your password" required /></Field>}
            {error && <div className="form-error"><AlertTriangle size={16} />{error}</div>}
            <button className="button primary full" type="submit">{isLogin ? "SIGN IN" : "SIGN UP"} <ArrowRight size={16} /></button>
          </form>
          {isLogin ? <div className="auth-links"><Link to="/forgot-password">Forget Password ?</Link><span>New to StockSense? <Link to="/signup">Sign Up</Link></span></div> : <div className="auth-links centered"><span>Already have an account? <Link to="/login">Login</Link></span></div>}
          {isLogin && <p className="demo-hint">Demo access: manager01 / Stocksense@2026</p>}
        </div>
      </main>
    </div>
  );
}

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  return (
    <div className="auth-layout">
      <div className="auth-brand-panel"><div className="brand-mark large"><Boxes size={28} /></div><p className="eyebrow light">INVENTORY OPERATIONS</p><h1>StockSense</h1><p>Secure access to the stock that keeps your business moving.</p><div className="auth-rule" /><span className="auth-caption">Password recovery</span></div>
      <main className="auth-form-panel"><div className="auth-form-wrap">
        <div className="mobile-brand"><div className="brand-mark"><Boxes size={21} /></div><strong>StockSense</strong></div>
        <p className="eyebrow">ACCOUNT ACCESS</p><h2>Reset your password</h2><p className="muted">Request a reset, verify the OTP, and set a new password.</p>
        <div className="stepper compact"><span className={step >= 1 ? "active" : ""}>1<span>Request</span></span><i /><span className={step >= 2 ? "active" : ""}>2<span>Verify</span></span><i /><span className={step >= 3 ? "active" : ""}>3<span>Set new</span></span></div>
        {step === 1 && <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setMessage("A verification code has been sent."); setStep(2); }}><Field label="Email Id"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required /></Field><button className="button primary full">REQUEST RESET <ArrowRight size={16} /></button></form>}
        {step === 2 && <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setMessage("OTP verified. Set a new password to finish."); setStep(3); }}><Field label="Verification code"><input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter the code" required /></Field><button className="button primary full">VERIFY OTP <ArrowRight size={16} /></button></form>}
        {step === 3 && <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setMessage("Password reset complete. You can now sign in."); setTimeout(() => navigate("/login"), 700); }}><Field label="New password"><input type="password" placeholder="Enter a new password" required /></Field><Field label="Re-Enter Password"><input type="password" placeholder="Confirm the new password" required /></Field><button className="button primary full">SET NEW PASSWORD <Check size={16} /></button></form>}
        {message && <div className="form-success"><Check size={16} />{message}</div>}<div className="auth-links centered"><Link to="/login">Back to Login</Link></div>
      </div></main>
    </div>
  );
}

function AppShell({ state, logout }) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalInitial, setAiModalInitial] = useState("");
  const location = useLocation();
  const nav = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);
  const goLogout = () => { logout(); nav("/login"); };

  const handleOpenAi = (query = "") => {
    setAiModalInitial(query);
    setAiModalOpen(true);
  };

  return (
    <div className="app-shell">
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation"><Menu size={21} /></button>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-brand"><div className="brand-mark"><Boxes size={20} /></div><div><strong>StockSense</strong><span>Inventory OS</span></div></div>
        <nav className="side-nav">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" active={isActive("/dashboard")} />
          <NavItem to="/products" icon={<Package size={17} />} label="Products" active={isActive("/products")} />
          <div className="nav-label">OPERATIONS</div>
          <NavItem to="/operations/receipts" icon={<ArrowDownToLine size={17} />} label="Receipts" active={isActive("/operations/receipts")} />
          <NavItem to="/operations/deliveries" icon={<ArrowUpFromLine size={17} />} label="Delivery Orders" active={isActive("/operations/deliveries")} />
          <NavItem to="/operations/transfers" icon={<ArrowLeftRight size={17} />} label="Internal Transfers" active={isActive("/operations/transfers")} />
          <NavItem to="/operations/adjustments" icon={<ClipboardCheck size={17} />} label="Inventory Adjustments" active={isActive("/operations/adjustments")} />
          <NavItem to="/move-history" icon={<Clock3 size={17} />} label="Move History" active={isActive("/move-history")} />
          <div className="nav-label">INVENTORY</div>
          <NavItem to="/stock" icon={<Boxes size={17} />} label="Stock" active={isActive("/stock")} />
          <div className="nav-label">SETTINGS</div>
          <NavItem to="/settings/warehouses" icon={<Building2 size={17} />} label="Warehouses" active={isActive("/settings/warehouses")} />
          <NavItem to="/settings/locations" icon={<MapPin size={17} />} label="Locations" active={isActive("/settings/locations")} />
        </nav>
        <div className="sidebar-bottom">
          <Link className="profile-mini" to="/profile"><div className="avatar">{state.user.loginId.slice(0, 2).toUpperCase()}</div><div><strong>{state.user.loginId}</strong><span>My Profile</span></div><ChevronRight size={15} /></Link>
          <button className="logout-link" onClick={goLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <OutletHeader
          state={state}
          notificationsOpen={notificationsOpen}
          onToggleNotifications={() => setNotificationsOpen((current) => !current)}
          onOpenAiModal={() => handleOpenAi("")}
        />
        <Outlet />
      </main>

      {/* Global AI Query Modal */}
      <AIQueryModal
        state={state}
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        initialQuery={aiModalInitial}
      />
    </div>
  );
}

function NavItem({ to, icon, label, active }) {
  return <Link className={`nav-item ${active ? "active" : ""}`} to={to}>{icon}<span>{label}</span></Link>;
}

function OutletHeader({ state, notificationsOpen, onToggleNotifications, onOpenAiModal }) {
  const { pathname } = useLocation();
  const notifications = buildNotifications(state);
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>StockSense</span>
        <ChevronRight size={14} />
        <strong>{pageTitle(pathname)}</strong>
      </div>
      <div className="topbar-actions">
        {/* Global AI Quick Access */}
        <button
          type="button"
          className="ai-topbar-btn"
          onClick={onOpenAiModal}
          title="Ask StockSense Intelligence"
        >
          <Sparkles size={14} />
          <span>Ask AI</span>
        </button>

        <div className="notification-wrap">
          <button
            className={`icon-button ${notificationsOpen ? "selected" : ""}`}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={onToggleNotifications}
          >
            <Bell size={18} />
            {notifications.length > 0 && <i />}
          </button>
          {notificationsOpen && (
            <div className="notifications-panel">
              <div className="notifications-heading">
                <div>
                  <p className="eyebrow">WORKSPACE ALERTS</p>
                  <h3>Notifications</h3>
                </div>
                <span>{notifications.length} active</span>
              </div>
              {notifications.length ? (
                notifications.map((notification) => (
                  <Link
                    to={notification.link}
                    className="notification-row"
                    key={notification.id}
                    onClick={onToggleNotifications}
                  >
                    <span className={`notification-icon ${notification.type}`}>
                      {notification.type === "stock" ? (
                        <AlertTriangle size={15} />
                      ) : notification.type === "waiting" ? (
                        <Clock3 size={15} />
                      ) : (
                        <CalendarDays size={15} />
                      )}
                    </span>
                    <span>
                      <strong>{notification.title}</strong>
                      <small>{notification.detail}</small>
                    </span>
                    <ChevronRight size={14} />
                  </Link>
                ))
              ) : (
                <div className="notification-empty">
                  <Check size={16} />
                  No active inventory alerts.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="top-user">
          <div className="avatar small">{state.user.loginId.slice(0, 2).toUpperCase()}</div>
          <span>{state.user.loginId}</span>
        </div>
      </div>
    </header>
  );
}

function pageTitle(path) {
  if (path.startsWith("/operations/receipts")) return "Receipts";
  if (path.startsWith("/operations/deliveries")) return "Delivery Orders";
  if (path.startsWith("/operations/transfers")) return "Internal Transfers";
  if (path.startsWith("/operations/adjustments")) return "Inventory Adjustments";
  if (path.startsWith("/settings/warehouses")) return "Warehouses";
  if (path.startsWith("/settings/locations")) return "Locations";
  if (path.startsWith("/products")) return "Products";
  if (path === "/move-history") return "Move History";
  if (path === "/stock") return "Stock";
  if (path === "/profile") return "My Profile";
  return "Dashboard";
}

function Page({ eyebrow, title, description, action, children, className = "" }) {
  return (
    <div className={`page ${className}`}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {action && <div className="page-actions">{action}</div>}
      </div>
      {children}
    </div>
  );
}

/* ==========================================================================
   StockSense Intelligence Dashboard Section
   ========================================================================== */
function StockSenseIntelligence({ state, onExplainProduct }) {
  const navigate = useNavigate();
  const [queryInput, setQueryInput] = useState("");
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const insights = useMemo(() => generateDashboardInsights(state), [state]);

  const handleQuery = (qText) => {
    const text = qText || queryInput;
    if (!text.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      const res = queryStockSense(text, state);
      setQueryResult(res);
      setIsLoading(false);
    }, 120);
  };

  const handleActionClick = (action) => {
    if (action.actionKey === "explain") {
      onExplainProduct?.(action.productId);
      return;
    }
    if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <section className="ai-intel-section">
      <div className="ai-intel-header">
        <div className="ai-intel-badge">
          <BrainCircuit size={20} />
          <span>StockSense Intelligence</span>
        </div>
        <span className="ai-live-tag">Live Analytics Engine</span>
      </div>

      <div className="ai-insights-container">
        {/* Proactive insights grid */}
        <div className="ai-insights-grid">
          {insights.slice(0, 4).map((item) => (
            <div key={item.id} className={`ai-insight-card ${item.severity || "info"}`}>
              <div className="ai-insight-card-top">
                <strong>{item.title}</strong>
                <span className="ai-insight-severity">{item.type.replace("_", " ")}</span>
              </div>
              <p className="ai-insight-reason">{item.reason}</p>
              {item.details && (
                <small className="muted" style={{ fontSize: "10.5px" }}>
                  {item.details}
                </small>
              )}

              <div className="ai-insight-actions">
                {item.actions?.map((act, i) => (
                  <button
                    key={i}
                    className="ai-insight-action-btn"
                    onClick={() => handleActionClick(act)}
                  >
                    {act.label} <ArrowRight size={11} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Ask StockSense Query Bar */}
        <div className="ai-query-box">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(queryInput);
            }}
            className="ai-query-form"
          >
            <div className="ai-input-wrap">
              <Sparkles size={16} />
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder='Ask StockSense... e.g. "Which products are at risk of running out?" or "Why is Steel Rod stock low?"'
              />
              {queryInput && (
                <button
                  type="button"
                  className="row-icon"
                  onClick={() => {
                    setQueryInput("");
                    setQueryResult(null);
                  }}
                  aria-label="Clear query"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button className="button primary" type="submit" disabled={isLoading}>
              {isLoading ? "Analyzing..." : "Ask StockSense"} <ArrowRight size={14} />
            </button>
          </form>

          {/* Prompt Suggestions */}
          <div className="ai-suggestions-row">
            <span>Suggestions:</span>
            <button
              type="button"
              className="ai-chip"
              onClick={() => {
                setQueryInput("Which products are at risk of running out?");
                handleQuery("Which products are at risk of running out?");
              }}
            >
              Which products are at risk of running out?
            </button>
            <button
              type="button"
              className="ai-chip"
              onClick={() => {
                setQueryInput("Why is Steel Rod stock low?");
                handleQuery("Why is Steel Rod stock low?");
              }}
            >
              Why is Steel Rod stock low?
            </button>
            <button
              type="button"
              className="ai-chip"
              onClick={() => {
                setQueryInput("What receipts are pending?");
                handleQuery("What receipts are pending?");
              }}
            >
              What receipts are pending?
            </button>
            <button
              type="button"
              className="ai-chip"
              onClick={() => {
                setQueryInput("Show recent movements");
                handleQuery("Show recent movements");
              }}
            >
              Show recent movements
            </button>
          </div>

          {/* Query Result Section */}
          {queryResult && (
            <div className="ai-response-box">
              <div className="ai-response-header">
                <h4>
                  <BrainCircuit size={16} style={{ color: "#2b67d8" }} />
                  {queryResult.title}
                </h4>
                <button
                  className="row-icon"
                  onClick={() => setQueryResult(null)}
                  aria-label="Close query response"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="ai-response-content">
                {queryResult.answer.split("\n\n").map((para, idx) => {
                  if (para.startsWith("### ")) {
                    return <h3 key={idx}>{para.replace("### ", "")}</h3>;
                  }
                  if (para.includes("\n• ") || para.startsWith("• ")) {
                    const lines = para.split("\n");
                    return (
                      <div key={idx} style={{ marginBottom: "8px" }}>
                        {lines.map((line, lIdx) => {
                          if (line.startsWith("• ")) {
                            return (
                              <div key={lIdx} style={{ paddingLeft: "12px", marginBottom: "3px" }}>
                                <FormattedInlineText text={line} />
                              </div>
                            );
                          }
                          return (
                            <p key={lIdx} style={{ margin: "4px 0 2px" }}>
                              <FormattedInlineText text={line} />
                            </p>
                          );
                        })}
                      </div>
                    );
                  }
                  return (
                    <p key={idx}>
                      <FormattedInlineText text={para} />
                    </p>
                  );
                })}
              </div>

              {/* Source Transparency */}
              {queryResult.sources?.length > 0 && (
                <div className="ai-response-sources">
                  <strong>Based on:</strong>
                  {queryResult.sources.map((src, i) => (
                    <span key={i} className="ai-source-badge">
                      • {src}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {queryResult.actions?.length > 0 && (
                <div className="ai-response-actions">
                  {queryResult.actions.map((act, i) => (
                    <button
                      key={i}
                      className="button secondary small"
                      onClick={() => handleActionClick(act)}
                    >
                      {act.label} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FormattedInlineText({ text }) {
  if (!text) return null;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="mono"
          style={{ background: "#f0f4fa", padding: "1px 5px", borderRadius: "3px", fontSize: "11px" }}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  return <>{parts}</>;
}

/* ==========================================================================
   Global AI Query Modal
   ========================================================================== */
function AIQueryModal({ state, isOpen, onClose, initialQuery = "" }) {
  const navigate = useNavigate();
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [queryResult, setQueryResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQueryInput(initialQuery || "");
      if (initialQuery) {
        setIsLoading(true);
        setTimeout(() => {
          setQueryResult(queryStockSense(initialQuery, state));
          setIsLoading(false);
        }, 100);
      } else {
        setQueryResult(null);
      }
    }
  }, [initialQuery, isOpen, state]);

  if (!isOpen) return null;

  const handleRunQuery = (text) => {
    const q = text || queryInput;
    if (!q.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setQueryResult(queryStockSense(q, state));
      setIsLoading(false);
    }, 120);
  };

  const handleAction = (act) => {
    onClose();
    if (act.path) navigate(act.path);
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-head">
          <h3>
            <BrainCircuit size={19} style={{ color: "#2b67d8" }} />
            Ask StockSense Intelligence
          </h3>
          <button className="row-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="ai-modal-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunQuery(queryInput);
            }}
            style={{ display: "flex", gap: "8px", marginBottom: "12px" }}
          >
            <div className="ai-input-wrap" style={{ flex: 1 }}>
              <Sparkles size={16} />
              <input
                autoFocus
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask anything about stock, movements, or risks..."
              />
            </div>
            <button className="button primary" type="submit" disabled={isLoading}>
              {isLoading ? "Querying..." : "Ask"}
            </button>
          </form>

          {/* Suggestions */}
          <div className="ai-suggestions-row" style={{ marginBottom: "16px" }}>
            <span>Try:</span>
            <button
              type="button"
              className="ai-chip"
              onClick={() => {
                setQueryInput("Which products are at risk of running out?");
                handleRunQuery("Which products are at risk of running out?");
              }}
            >
              Which products are at risk of running out?
            </button>
            <button
              type="button"
              className="ai-chip"
              onClick={() => {
                setQueryInput("Why is Steel Rod stock low?");
                handleRunQuery("Why is Steel Rod stock low?");
              }}
            >
              Why is Steel Rod stock low?
            </button>
            <button
              type="button"
              className="ai-chip"
              onClick={() => {
                setQueryInput("What deliveries are pending?");
                handleRunQuery("What deliveries are pending?");
              }}
            >
              Pending Deliveries
            </button>
          </div>

          {/* Results */}
          {queryResult && (
            <div className="ai-response-box" style={{ marginTop: 0 }}>
              <div className="ai-response-header">
                <h4>
                  <BrainCircuit size={16} style={{ color: "#2b67d8" }} />
                  {queryResult.title}
                </h4>
              </div>

              <div className="ai-response-content">
                {queryResult.answer.split("\n\n").map((para, idx) => {
                  if (para.startsWith("### ")) {
                    return <h3 key={idx}>{para.replace("### ", "")}</h3>;
                  }
                  if (para.includes("\n• ") || para.startsWith("• ")) {
                    const lines = para.split("\n");
                    return (
                      <div key={idx} style={{ marginBottom: "8px" }}>
                        {lines.map((line, lIdx) => (
                          <div
                            key={lIdx}
                            style={{ paddingLeft: line.startsWith("• ") ? "12px" : 0, marginBottom: "3px" }}
                          >
                            <FormattedInlineText text={line} />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <p key={idx}>
                      <FormattedInlineText text={para} />
                    </p>
                  );
                })}
              </div>

              {queryResult.sources?.length > 0 && (
                <div className="ai-response-sources">
                  <strong>Sources:</strong>
                  {queryResult.sources.map((src, i) => (
                    <span key={i} className="ai-source-badge">
                      • {src}
                    </span>
                  ))}
                </div>
              )}

              {queryResult.actions?.length > 0 && (
                <div className="ai-response-actions">
                  {queryResult.actions.map((act, i) => (
                    <button
                      key={i}
                      className="button secondary small"
                      onClick={() => handleAction(act)}
                    >
                      {act.label} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Product Page AI Intelligence Card
   ========================================================================== */
function ProductAIIntelligence({ product, state, autoExplain = false }) {
  const [isExplainOpen, setIsExplainOpen] = useState(autoExplain);
  const intel = useMemo(() => calculateProductIntelligence(product, state), [product, state]);

  useEffect(() => {
    if (autoExplain) setIsExplainOpen(true);
  }, [autoExplain]);

  if (!intel) return null;

  return (
    <section className={`ai-product-box ${intel.health}`}>
      <div className="ai-product-header">
        <h4>
          <BrainCircuit size={17} style={{ color: "#2b67d8" }} />
          StockSense AI Intelligence · Stock Health & Velocity
        </h4>
        <StatusBadge
          status={
            intel.health === "critical"
              ? "Low Stock"
              : intel.health === "out"
              ? "Out of Stock"
              : "In Stock"
          }
        />
      </div>

      <div className="ai-product-body">
        <div className="ai-product-grid">
          <div className="ai-stat-card">
            <span>Current Stock</span>
            <strong>{intel.onHand} {product.uom}</strong>
          </div>
          <div className="ai-stat-card">
            <span>Free to Use</span>
            <strong>{intel.freeToUse} {product.uom}</strong>
          </div>
          <div className="ai-stat-card">
            <span>Reorder Point</span>
            <strong>{intel.reorderPoint} {product.uom}</strong>
          </div>
          <div className="ai-stat-card">
            <span>Weekly Dispatches</span>
            <strong>{intel.dispatched7d} {product.uom}</strong>
          </div>
        </div>

        {/* Depletion or Stockout Alert */}
        {intel.onHand <= intel.reorderPoint && (
          <div className="notice warning" style={{ margin: "0 0 12px" }}>
            <AlertTriangle size={16} />
            <div>
              <strong>
                {intel.onHand === 0
                  ? "Product is completely depleted."
                  : `Current stock is below the configured reorder level (${intel.reorderPoint} ${product.uom}).`}
              </strong>
              <div style={{ fontSize: "11px", marginTop: "2px" }}>
                {intel.estimatedDepletionDays !== null
                  ? `Estimated depletion: ~${intel.estimatedDepletionDays} days based on recent outgoing usage.`
                  : "Consider scheduling a replenishment receipt to prevent stockouts."}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            className="button secondary small"
            onClick={() => setIsExplainOpen(!isExplainOpen)}
          >
            <Sparkles size={14} style={{ color: "#2b67d8" }} />
            {isExplainOpen ? "Hide Stock Explanation" : "Explain Stock Change"}
            <ChevronDown
              size={14}
              style={{
                transform: isExplainOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
          </button>

          <Link
            to={`/move-history?query=${encodeURIComponent(product.name)}`}
            className="button ghost small"
          >
            <Clock3 size={14} /> View Related Movements
          </Link>

          <Link to="/operations/deliveries" className="button ghost small">
            <Truck size={14} /> View Deliveries
          </Link>

          <Link to="/operations/receipts/new" className="button ghost small">
            <Plus size={14} /> Create Receipt
          </Link>
        </div>

        {/* Explain Breakdown */}
        {isExplainOpen && (
          <div className="ai-explain-drawer">
            <p className="eyebrow" style={{ marginBottom: "6px" }}>
              7-DAY STOCK CHANGE BREAKDOWN & DRIVERS
            </p>
            <div style={{ fontSize: "12px", color: "#2b3e58", lineHeight: 1.55 }}>
              {intel.drivers.length ? (
                intel.drivers.map((driver, idx) => (
                  <div key={idx} style={{ marginBottom: "4px" }}>
                    • {driver}
                  </div>
                ))
              ) : (
                <div>• No stock movements recorded in the last 7 days.</div>
              )}
            </div>

            <div className="ai-response-sources" style={{ marginTop: "10px", paddingTop: "8px" }}>
              <strong>Analyzed:</strong>
              <span className="ai-source-badge">• Move History Ledger</span>
              <span className="ai-source-badge">• Safety Reorder Buffer</span>
              <span className="ai-source-badge">• Pending Incoming/Outgoing Orders</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   Dashboard
   ========================================================================== */
function Dashboard({ state }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    documentType: "All document types",
    status: "All statuses",
    location: "All locations",
    category: "All categories",
  });
  const selectedLocation = state.locations.find((location) => location.name === filters.location);
  const matchesLocation = (item) => !selectedLocation || item.lines?.some((line) => line.locationId === selectedLocation.id);
  const matchesCategory = (item) =>
    filters.category === "All categories" ||
    item.lines?.some((line) => state.products.find((product) => product.id === line.productId)?.category === filters.category);
  const matchesOperation = (item, type) => {
    const typeMatches = filters.documentType === "All document types" || filters.documentType === type;
    const statusMatches = filters.status === "All statuses" || item.status === filters.status;
    return typeMatches && statusMatches && matchesLocation(item) && matchesCategory(item);
  };
  const receipts = state.receipts.filter((receipt) => matchesOperation(receipt, "Receipts"));
  const deliveries = state.deliveries.filter((delivery) => matchesOperation(delivery, "Delivery"));
  const visibleProducts = state.products.filter(
    (product) =>
      (filters.category === "All categories" || product.category === filters.category) &&
      (!selectedLocation || Object.prototype.hasOwnProperty.call(product.stocks, selectedLocation.id))
  );
  const quantityFor = (product) => (selectedLocation ? product.stocks[selectedLocation.id] || 0 : totalStock(product));
  const lowStock = visibleProducts.filter((product) => quantityFor(product) <= product.reorder);
  const transferMatches = filters.documentType === "All document types" || filters.documentType === "Internal";
  const transfers =
    transferMatches && filters.status === "All statuses"
      ? state.transfers.filter(
          (transfer) =>
            (!selectedLocation || transfer.from === selectedLocation.id || transfer.to === selectedLocation.id) &&
            (filters.category === "All categories" || state.products.find((product) => product.id === transfer.productId)?.category === filters.category)
        ).length
      : 0;
  const pendingReceipts = receipts.filter((receipt) => !["Done", "Canceled"].includes(receipt.status)).length;
  const pendingDeliveries = deliveries.filter((delivery) => !["Done", "Canceled"].includes(delivery.status)).length;
  const setFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));

  return (
    <Page eyebrow="OVERVIEW" title="Dashboard" description="Your current inventory and operations snapshot.">
      {/* StockSense Intelligence Layer */}
      <StockSenseIntelligence
        state={state}
        onExplainProduct={(prodId) => navigate(`/products/${prodId}/edit?explain=true`)}
      />

      <div className="filter-bar dashboard-filter">
        <div className="filter-title">
          <Filter size={16} /> FILTERS
        </div>
        <Select
          label="Document type"
          options={["All document types", "Receipts", "Delivery", "Internal", "Adjustments"]}
          value={filters.documentType}
          onChange={setFilter("documentType")}
        />
        <Select
          label="Status"
          options={["All statuses", "Draft", "Waiting", "Ready", "Done", "Canceled"]}
          value={filters.status}
          onChange={setFilter("status")}
        />
        <Select
          label="Warehouse / location"
          options={["All locations", ...state.locations.map((location) => location.name)]}
          value={filters.location}
          onChange={setFilter("location")}
        />
        <Select
          label="Product category"
          options={["All categories", ...unique(state.products.map((product) => product.category))]}
          value={filters.category}
          onChange={setFilter("category")}
        />
      </div>

      <div className="kpi-grid">
        <Kpi
          label="Total Products in Stock"
          value={visibleProducts.length}
          detail="Active products"
          icon={<Package size={19} />}
          tone="blue"
          onClick={() => navigate("/products")}
        />
        <Kpi
          label="Low Stock / Out of Stock"
          value={lowStock.length}
          detail="Needs attention"
          icon={<AlertTriangle size={19} />}
          tone="red"
          onClick={() => navigate("/products?filter=low")}
        />
        <Kpi
          label="Pending Receipts"
          value={pendingReceipts}
          detail="Incoming operations"
          icon={<ArrowDownToLine size={19} />}
          tone="amber"
          onClick={() => navigate("/operations/receipts")}
        />
        <Kpi
          label="Pending Deliveries"
          value={pendingDeliveries}
          detail="Outgoing operations"
          icon={<ArrowUpFromLine size={19} />}
          tone="green"
          onClick={() => navigate("/operations/deliveries")}
        />
        <Kpi
          label="Internal Transfers Scheduled"
          value={transfers}
          detail="Location movements"
          icon={<ArrowLeftRight size={19} />}
          tone="purple"
          onClick={() => navigate("/operations/transfers")}
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel summary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">INCOMING</p>
              <h3>Receipt summary</h3>
            </div>
            <Link to="/operations/receipts" className="text-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="summary-stats">
            <SummaryStat
              label="To receive"
              value={receipts.filter((receipt) => receipt.status !== "Done" && receipt.status !== "Canceled").length}
              tone="blue"
            />
            <SummaryStat
              label="Late"
              value={receipts.filter((receipt) => receipt.date < today && receipt.status !== "Done" && receipt.status !== "Canceled").length}
              tone="red"
            />
            <SummaryStat label="Operations" value={receipts.length} tone="slate" />
          </div>
          <OperationMiniList items={receipts} type="receipt" />
        </section>
        <section className="panel summary-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">OUTGOING</p>
              <h3>Delivery summary</h3>
            </div>
            <Link to="/operations/deliveries" className="text-link">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="summary-stats">
            <SummaryStat
              label="To deliver"
              value={deliveries.filter((delivery) => delivery.status !== "Done" && delivery.status !== "Canceled").length}
              tone="green"
            />
            <SummaryStat
              label="Late"
              value={deliveries.filter((delivery) => delivery.date < today && delivery.status !== "Done" && delivery.status !== "Canceled").length}
              tone="red"
            />
            <SummaryStat
              label="Waiting"
              value={deliveries.filter((delivery) => delivery.status === "Waiting").length}
              tone="amber"
            />
          </div>
          <OperationMiniList items={deliveries} type="delivery" />
        </section>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">STOCK HEALTH</p>
            <h3>Products needing attention</h3>
          </div>
          <Link to="/stock" className="text-link">
            Open stock <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / Code</th>
                <th>Category</th>
                <th>On Hand</th>
                <th>Reorder Point</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length ? (
                lowStock.map((product) => (
                  <tr key={product.id} onClick={() => navigate(`/products/${product.id}/edit`)}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>
                    <td className="mono">{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{quantityFor(product)}</td>
                    <td>{product.reorder}</td>
                    <td>
                      <StatusBadge status={quantityFor(product) === 0 ? "Out of Stock" : "Low Stock"} />
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow text="All products are above their reorder point." />
              )}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}

function Kpi({ label, value, detail, icon, tone, onClick }) {
  return (
    <button className={`kpi kpi-${tone}`} onClick={onClick}>
      <span className="kpi-icon">{icon}</span>
      <span className="kpi-label">{label}</span>
      <strong>{value}</strong>
      <span className="kpi-detail">
        {detail}
        <ArrowRight size={13} />
      </span>
    </button>
  );
}

function SummaryStat({ label, value, tone }) {
  return (
    <div className={`summary-stat ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function OperationMiniList({ items, type }) {
  return (
    <div className="mini-list">
      {items.slice(0, 3).map((item) => (
        <Link
          to={`/operations/${type === "receipt" ? "receipts" : "deliveries"}/${item.id}`}
          className="mini-row"
          key={item.id}
        >
          <span className={`direction-dot ${type === "receipt" ? "in" : "out"}`}>
            {type === "receipt" ? <ArrowDownToLine size={13} /> : <ArrowUpFromLine size={13} />}
          </span>
          <span>
            <strong>{item.reference}</strong>
            <small>{item.contact}</small>
          </span>
          <StatusBadge status={item.status} />
        </Link>
      ))}
    </div>
  );
}

/* ==========================================================================
   Products Catalog
   ========================================================================== */
function Products({ state }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All categories");
  const [stockFilter, setStockFilter] = useState(searchParams.get("filter") || "all");

  useEffect(() => {
    const q = searchParams.get("query");
    if (q !== null) setQuery(q || "");
    const f = searchParams.get("filter");
    if (f) setStockFilter(f);
    const c = searchParams.get("category");
    if (c) setCategory(c);
  }, [searchParams]);

  const products = state.products.filter((p) => {
    const matchesQuery = `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All categories" || p.category === category;
    const stock = totalStock(p);
    let matchesStock = true;
    if (stockFilter === "low") matchesStock = stock <= p.reorder;
    else if (stockFilter === "out") matchesStock = stock === 0;
    return matchesQuery && matchesCategory && matchesStock;
  });

  return (
    <Page
      eyebrow="CATALOG"
      title="Products"
      description="Manage product information and location-aware stock."
      action={
        <Link className="button primary" to="/products/new">
          <Plus size={17} /> New Product
        </Link>
      }
    >
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product or SKU"
          />
        </div>
        <Select
          options={["All categories", ...unique(state.products.map((p) => p.category))]}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <div className="view-toggle">
          <button
            className={stockFilter === "all" ? "active" : ""}
            onClick={() => setStockFilter("all")}
          >
            All Stock
          </button>
          <button
            className={stockFilter === "low" ? "active" : ""}
            onClick={() => setStockFilter("low")}
          >
            Low Stock
          </button>
          <button
            className={stockFilter === "out" ? "active" : ""}
            onClick={() => setStockFilter("out")}
          >
            Out of Stock
          </button>
        </div>
      </div>

      <div className="table-meta">
        <span>{products.length} products</span>
        <span className="muted">
          {stockFilter !== "all" ? `Filtered by: ${stockFilter} stock` : "SKU search and smart filters"}
        </span>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / Code</th>
                <th>Category</th>
                <th>Unit of Measure</th>
                <th>On Hand</th>
                <th>Free to Use</th>
                <th>Locations</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const onHand = totalStock(p);
                const free = freeToUseStock(p, state);
                const isLow = onHand <= p.reorder;
                const isOut = onHand === 0;

                return (
                  <tr key={p.id} onClick={() => navigate(`/products/${p.id}/edit`)}>
                    <td>
                      <div className="cell-title">
                        <span className="product-icon">
                          <Package size={15} />
                        </span>
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td className="mono">{p.sku}</td>
                    <td>{p.category}</td>
                    <td>{p.uom}</td>
                    <td>
                      <strong>{onHand}</strong>
                    </td>
                    <td>{free}</td>
                    <td>
                      <span className="location-count">
                        {Object.values(p.stocks).filter((v) => v > 0).length} locations
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"} />
                    </td>
                    <td>
                      <button
                        className="row-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/products/${p.id}/edit`);
                        }}
                        aria-label="Edit product"
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!products.length && <EmptyRow text="No products match your search or filters." />}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}

/* ==========================================================================
   Product Form & AI Intelligence View
   ========================================================================== */
function ProductForm({ state, update }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoExplain = searchParams.get("explain") === "true";

  const product = state.products.find((p) => p.id === id);
  const isEdit = Boolean(product);
  const [form, setForm] = useState(
    product
      ? { ...product }
      : { name: "", sku: "", category: "", uom: "Units", initialStock: "", reorder: 0 }
  );
  const [error, setError] = useState("");
  const change = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.sku || !form.category || !form.uom) {
      return setError("Complete all product information fields.");
    }
    if (state.products.some((p) => p.sku.toLowerCase() === form.sku.toLowerCase() && p.id !== id)) {
      return setError("SKU / Code must be unique.");
    }
    if (Number(form.initialStock || 0) < 0 || Number(form.reorder || 0) < 0) {
      return setError("Stock values cannot be negative.");
    }
    update((current) => {
      if (isEdit) {
        return {
          ...current,
          products: current.products.map((p) =>
            p.id === id
              ? {
                  ...p,
                  name: form.name,
                  sku: form.sku.toUpperCase(),
                  category: form.category,
                  uom: form.uom,
                  reorder: Number(form.reorder || 0),
                }
              : p
          ),
        };
      }
      return {
        ...current,
        products: [
          ...current.products,
          {
            id: uid("p"),
            name: form.name,
            sku: form.sku.toUpperCase(),
            category: form.category,
            uom: form.uom,
            reorder: Number(form.reorder || 0),
            cost: 0,
            stocks: { "loc-1": Number(form.initialStock || 0) },
          },
        ],
      };
    });
    navigate("/products");
  };

  return (
    <Page
      eyebrow="CATALOG / PRODUCTS"
      title={isEdit ? `Edit Product · ${product.name}` : "New Product"}
      description={
        isEdit
          ? "Update product specifications and review AI stock health."
          : "Add a product to your inventory catalog."
      }
      action={
        <Link className="button secondary" to="/products">
          <ArrowRight size={16} className="rotate-180" /> Back to Products
        </Link>
      }
    >
      {/* AI Intelligence section for existing products */}
      {isEdit && <ProductAIIntelligence product={product} state={state} autoExplain={autoExplain} />}

      <form onSubmit={save} className="business-form">
        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <h3>Product Information</h3>
              <p className="muted">Keep catalog details consistent for every operation.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Name" required>
              <input value={form.name} onChange={change("name")} placeholder="e.g. Desk" />
            </Field>
            <Field label="SKU / Code" required>
              <input value={form.sku} onChange={change("sku")} placeholder="e.g. DESK001" />
            </Field>
            <Field label="Category" required>
              <input value={form.category} onChange={change("category")} placeholder="e.g. Furniture" />
            </Field>
            <Field label="Unit of Measure" required>
              <select value={form.uom} onChange={change("uom")}>
                <option>Units</option>
                <option>Kg</option>
                <option>Litres</option>
                <option>Boxes</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <h3>Inventory & Reorder Rules</h3>
              <p className="muted">Initial stock applies to Main Stock. Reorder level triggers AI alerts.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Initial Stock">
              <input
                type="number"
                min="0"
                value={form.initialStock ?? ""}
                onChange={change("initialStock")}
                placeholder={isEdit ? "Existing stock is unchanged" : "0"}
                disabled={isEdit}
              />
            </Field>
            <Field label="Reorder Point (Safety Level)">
              <input
                type="number"
                min="0"
                value={form.reorder ?? 0}
                onChange={change("reorder")}
              />
            </Field>
          </div>
        </section>

        {error && (
          <div className="form-error inline">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="form-actions">
          <Link className="button secondary" to="/products">
            Discard
          </Link>
          <button className="button primary" type="submit">
            <Check size={16} /> {isEdit ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </Page>
  );
}

/* ==========================================================================
   Stock Table
   ========================================================================== */
function Stock({ state }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") || "");

  useEffect(() => {
    const q = searchParams.get("query");
    if (q !== null) setQuery(q || "");
  }, [searchParams]);

  const rows = state.products
    .flatMap((p) => Object.entries(p.stocks).map(([locationId, qty]) => ({ p, locationId, qty })))
    .filter(({ p }) => `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <Page
      eyebrow="INVENTORY"
      title="Stock"
      description="Current quantities by product and warehouse location."
      action={
        <Link className="button primary" to="/operations/adjustments">
          <Plus size={17} /> Update Stock
        </Link>
      }
    >
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product or SKU"
          />
        </div>
      </div>
      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Per Unit Cost</th>
                <th>Warehouse / Location</th>
                <th>On Hand</th>
                <th>Free to Use</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, locationId, qty }) => {
                const location = state.locations.find((l) => l.id === locationId);
                const free =
                  qty -
                  state.deliveries
                    .flatMap((d) => d.lines)
                    .filter(
                      (l) =>
                        l.productId === p.id &&
                        l.locationId === locationId &&
                        !["Done", "Canceled"].includes(state.deliveries.find((d) => d.lines.includes(l))?.status)
                    )
                    .reduce((a, l) => a + l.quantity, 0);

                return (
                  <tr key={`${p.id}-${locationId}`}>
                    <td>
                      <div className="cell-title">
                        <span className="product-icon">
                          <Package size={15} />
                        </span>
                        <strong>{p.name}</strong>
                        <small className="mono">{p.sku}</small>
                      </div>
                    </td>
                    <td>₹{p.cost.toLocaleString("en-IN")}</td>
                    <td>
                      {location?.name}
                      <small className="sub-cell">
                        {state.warehouses.find((w) => w.id === location?.warehouseId)?.name}
                      </small>
                    </td>
                    <td>
                      <strong>{qty}</strong>
                    </td>
                    <td>{Math.max(0, free)}</td>
                    <td>
                      <StatusBadge status={qty === 0 ? "Out of Stock" : qty <= p.reorder ? "Low Stock" : "In Stock"} />
                    </td>
                    <td>
                      <button className="button ghost small" onClick={() => navigate("/operations/adjustments")}>
                        Adjust
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </Page>
  );
}

/* ==========================================================================
   Operations: Receipts & Deliveries
   ========================================================================== */
function OperationsList({ kind, state }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [view, setView] = useState("list");
  const [status, setStatus] = useState(searchParams.get("status") || "All statuses");

  useEffect(() => {
    const s = searchParams.get("status");
    if (s) setStatus(s);
    const q = searchParams.get("query");
    if (q !== null) setQuery(q || "");
  }, [searchParams]);

  const items = (kind === "receipt" ? state.receipts : state.deliveries).filter(
    (item) =>
      `${item.reference} ${item.contact}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "All statuses" || item.status === status)
  );
  const noun = kind === "receipt" ? "Receipt" : "Delivery";

  return (
    <Page
      eyebrow={`OPERATIONS / ${kind === "receipt" ? "INCOMING" : "OUTGOING"}`}
      title={kind === "receipt" ? "Receipts" : "Delivery Orders"}
      description={kind === "receipt" ? "Track incoming goods from vendors." : "Prepare and validate outgoing stock."}
      action={
        <Link className="button primary" to={`/operations/${kind === "receipt" ? "receipts" : "deliveries"}/new`}>
          <Plus size={17} /> New {noun}
        </Link>
      }
    >
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference or contact"
          />
        </div>
        <Select
          options={["All statuses", "Draft", "Waiting", "Ready", "Done", "Canceled"]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <div className="view-toggle">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <List size={16} /> List View
          </button>
          <button className={view === "kanban" ? "active" : ""} onClick={() => setView("kanban")}>
            <BarChart3 size={16} /> Kanban View
          </button>
        </div>
      </div>
      <div className="table-meta">
        <span>
          {items.length} {kind === "receipt" ? "receipts" : "deliveries"}
        </span>
        <span className="muted">Default view: List View</span>
      </div>
      {view === "list" ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Contact</th>
                  <th>Schedule Date</th>
                  <th>Responsible</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/operations/${kind === "receipt" ? "receipts" : "deliveries"}/${item.id}`)}
                  >
                    <td className="mono strong-text">{item.reference}</td>
                    <td>{item.contact}</td>
                    <td>
                      <DateLabel date={item.date} status={item.status} />
                    </td>
                    <td>{item.responsible}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <ChevronRight size={17} className="muted" />
                    </td>
                  </tr>
                ))}
                {!items.length && <EmptyRow text={`No ${kind === "receipt" ? "receipts" : "deliveries"} match your filters.`} />}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <Kanban items={items} kind={kind} />
      )}
    </Page>
  );
}

function Kanban({ items, kind }) {
  const navigate = useNavigate();
  const statuses = kind === "receipt" ? ["Draft", "Ready", "Done", "Canceled"] : ["Draft", "Waiting", "Ready", "Done", "Canceled"];
  return (
    <div className="kanban">
      {statuses.map((status) => (
        <section className="kanban-col" key={status}>
          <div className="kanban-heading">
            <span className={`status-dot ${status.toLowerCase()}`} />
            {status}
            <span>{items.filter((i) => i.status === status).length}</span>
          </div>
          {items
            .filter((i) => i.status === status)
            .map((item) => (
              <button
                className="kanban-card"
                key={item.id}
                onClick={() => navigate(`/operations/${kind === "receipt" ? "receipts" : "deliveries"}/${item.id}`)}
              >
                <strong>{item.reference}</strong>
                <span>{item.contact}</span>
                <small>
                  <CalendarDays size={13} /> {formatDate(item.date)}
                </small>
              </button>
            ))}
        </section>
      ))}
    </div>
  );
}

function OperationForm({ kind, state, update }) {
  const navigate = useNavigate();
  const isReceipt = kind === "receipt";
  const collection = isReceipt ? "receipts" : "deliveries";
  const [form, setForm] = useState({
    contact: "",
    address: "",
    date: today,
    productId: "",
    quantity: "",
    locationId: "",
  });
  const [error, setError] = useState("");
  const change = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }));

  const save = (e) => {
    e.preventDefault();
    setError("");
    const quantity = Number(form.quantity);
    if (
      !form.contact ||
      (!isReceipt && !form.address) ||
      !form.date ||
      !form.productId ||
      !form.locationId ||
      !quantity ||
      quantity < 1
    ) {
      return setError("Complete the contact, schedule, product, quantity, and location fields.");
    }
    const warehouse =
      state.warehouses.find((w) => w.id === state.locations.find((l) => l.id === form.locationId)?.warehouseId) ||
      state.warehouses[0];
    const prefix = `${warehouse.code}/${isReceipt ? "IN" : "OUT"}`;
    const nextNumber = state[collection].length + 1;
    const item = {
      id: uid(isReceipt ? "r" : "d"),
      reference: `${prefix}/${String(nextNumber).padStart(4, "0")}`,
      contact: form.contact,
      date: form.date,
      status: "Draft",
      responsible: state.user.loginId,
      lines: [{ productId: form.productId, quantity, locationId: form.locationId }],
      ...(isReceipt ? {} : { address: form.address, operationType: "Delivery Order" }),
    };
    update((current) => ({ ...current, [collection]: [...current[collection], item] }));
    navigate(`/operations/${collection}/${item.id}`);
  };

  return (
    <Page
      eyebrow={`OPERATIONS / ${isReceipt ? "INCOMING" : "OUTGOING"}`}
      title={isReceipt ? "New Receipt" : "New Delivery"}
      description={isReceipt ? "Create an incoming stock receipt." : "Create an outgoing delivery order."}
      action={
        <Link className="button secondary" to={`/operations/${collection}`}>
          <ArrowRight size={16} className="rotate-180" /> Back to list
        </Link>
      }
    >
      <form onSubmit={save} className="business-form">
        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DOCUMENT DETAILS</p>
              <h3>{isReceipt ? "Receive From" : "Delivery details"}</h3>
              <p className="muted">The responsible user is filled from the current account.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label={isReceipt ? "Receive From" : "Contact"} required>
              <input
                value={form.contact}
                onChange={change("contact")}
                placeholder={isReceipt ? "Supplier or vendor" : "Customer or contact"}
              />
            </Field>
            {!isReceipt && (
              <Field label="Delivery Address" required>
                <input
                  value={form.address}
                  onChange={change("address")}
                  placeholder="Delivery address"
                />
              </Field>
            )}
            <Field label="Schedule Date" required>
              <input type="date" value={form.date} onChange={change("date")} />
            </Field>
            <Field label="Responsible">
              <input value={state.user.loginId} readOnly />
            </Field>
          </div>
        </section>
        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PRODUCTS</p>
              <h3>Add product line</h3>
              <p className="muted">Enter the quantity for the selected warehouse location.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Product" required>
              <select value={form.productId} onChange={change("productId")}>
                <option value="">Select product</option>
                {state.products.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity" required>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={change("quantity")}
                placeholder="0"
              />
            </Field>
            <Field label="Warehouse / Location" required>
              <select value={form.locationId} onChange={change("locationId")}>
                <option value="">Select location</option>
                {state.locations.map((l) => (
                  <option value={l.id} key={l.id}>
                    {locationLabel(state, l.id)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>
        {error && (
          <div className="form-error inline">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        <div className="form-actions">
          <Link className="button secondary" to={`/operations/${collection}`}>
            Discard
          </Link>
          <button className="button primary" type="submit">
            <Check size={16} /> Create {isReceipt ? "Receipt" : "Delivery"}
          </button>
        </div>
      </form>
    </Page>
  );
}

function OperationDetail({ kind, state, update }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const collection = kind === "receipt" ? "receipts" : "deliveries";
  const item = state[collection].find((entry) => entry.id === id);
  const [notice, setNotice] = useState("");
  if (!item) {
    return (
      <Page title={`${kind === "receipt" ? "Receipt" : "Delivery"} not found`}>
        <Link to={`/operations/${collection}`} className="button secondary">
          Back to list
        </Link>
      </Page>
    );
  }
  const isReceipt = kind === "receipt";
  const lines = item.lines.map((line) => ({
    ...line,
    product: state.products.find((p) => p.id === line.productId),
    location: state.locations.find((l) => l.id === line.locationId),
  }));
  const stockBlocked =
    !isReceipt &&
    lines.some(({ product, locationId, quantity }) => {
      const available = product?.stocks?.[locationId];
      return available !== undefined && available < quantity;
    });

  const transition = (action) => {
    if (action === "cancel") {
      if (!window.confirm("Cancel this operation?")) return;
      update((current) => ({
        ...current,
        [collection]: current[collection].map((entry) =>
          entry.id === id ? { ...entry, status: "Canceled" } : entry
        ),
      }));
      return;
    }
    if (action === "print") {
      window.print();
      return;
    }
    if (isReceipt && item.status === "Draft") {
      update((current) => ({
        ...current,
        receipts: current.receipts.map((entry) =>
          entry.id === id ? { ...entry, status: "Ready" } : entry
        ),
      }));
    } else if (isReceipt && item.status === "Ready") {
      update((current) => applyOperation(current, item, "receipt"));
      setNotice("Receipt validated and stock increased.");
    } else if (!isReceipt && item.status === "Draft") {
      const next = stockBlocked ? "Waiting" : "Ready";
      update((current) => ({
        ...current,
        deliveries: current.deliveries.map((entry) =>
          entry.id === id ? { ...entry, status: next } : entry
        ),
      }));
      if (stockBlocked) setNotice("Some lines are waiting for stock.");
    } else if (!isReceipt && item.status === "Waiting" && !stockBlocked) {
      update((current) => ({
        ...current,
        deliveries: current.deliveries.map((entry) =>
          entry.id === id ? { ...entry, status: "Ready" } : entry
        ),
      }));
    } else if (!isReceipt && item.status === "Ready") {
      if (stockBlocked) return setNotice("Cannot validate: required stock is unavailable.");
      update((current) => applyOperation(current, item, "delivery"));
      setNotice("Delivery validated and stock decreased.");
    }
  };

  const primaryLabel =
    item.status === "Draft"
      ? "To Do"
      : item.status === "Ready"
      ? "Validate"
      : item.status === "Waiting"
      ? "Check Stock"
      : null;

  return (
    <Page
      eyebrow={`OPERATIONS / ${isReceipt ? "RECEIPTS" : "DELIVERY ORDERS"}`}
      title={isReceipt ? "Receipt" : "Delivery Order"}
      description={`${item.reference} · ${item.contact}`}
      action={
        <Link className="button secondary" to={`/operations/${collection}`}>
          <ArrowRight size={16} className="rotate-180" /> Back to list
        </Link>
      }
    >
      <section className="detail-hero panel">
        <div>
          <div className="detail-title-row">
            <span className={`document-icon ${isReceipt ? "incoming" : "outgoing"}`}>
              {isReceipt ? <ArrowDownToLine size={21} /> : <ArrowUpFromLine size={21} />}
            </span>
            <div>
              <p className="eyebrow">{isReceipt ? "RECEIPT" : "DELIVERY ORDER"}</p>
              <h2>{item.reference}</h2>
            </div>
            <StatusBadge status={item.status} />
          </div>
          <div className="status-flow">
            {(isReceipt ? ["Draft", "Ready", "Done"] : ["Draft", "Waiting", "Ready", "Done"]).map(
              (status, index, stages) => (
                <React.Fragment key={status}>
                  <span className={stages.indexOf(item.status) >= index ? "complete" : ""}>
                    {stages.indexOf(item.status) > index && <Check size={13} />}
                    {status}
                  </span>
                  {index < stages.length - 1 && (
                    <i className={stages.indexOf(item.status) > index ? "complete" : ""} />
                  )}
                </React.Fragment>
              )
            )}
          </div>
        </div>
        <div className="detail-actions">
          {primaryLabel && (
            <button
              className="button primary"
              onClick={() => transition("next")}
              disabled={item.status === "Waiting" && stockBlocked}
            >
              {primaryLabel} <ArrowRight size={16} />
            </button>
          )}
          {(!isReceipt || item.status === "Done") && item.status !== "Canceled" && (
            <button className="button secondary" onClick={() => transition("print")}>
              <FileText size={16} /> Print
            </button>
          )}
          {!["Done", "Canceled"].includes(item.status) && (
            <button className="button danger-outline" onClick={() => transition("cancel")}>
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </section>
      {notice && (
        <div className={`notice ${stockBlocked ? "warning" : "success"}`}>
          <AlertTriangle size={17} />
          {notice}
        </div>
      )}
      <div className="detail-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DOCUMENT DETAILS</p>
              <h3>{isReceipt ? "Receive From" : "Delivery details"}</h3>
            </div>
          </div>
          <div className="metadata-grid">
            <Meta label={isReceipt ? "Receive From" : "Delivery Address"} value={isReceipt ? item.contact : item.address} />
            <Meta label="Schedule Date" value={formatDate(item.date)} />
            <Meta
              label={isReceipt ? "Responsible" : "Operation Type"}
              value={isReceipt ? item.responsible : item.operationType}
            />
            <Meta
              label={isReceipt ? "Status" : "Responsible"}
              value={isReceipt ? item.status : item.responsible}
            />
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PRODUCTS</p>
              <h3>
                {lines.length} product line{lines.length !== 1 ? "s" : ""}
              </h3>
            </div>
            <Link className="button ghost small" to={`/operations/${collection}/new`}>
              <Plus size={15} /> New
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Location</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(({ product, location, quantity }) => (
                  <tr
                    key={product?.id}
                    className={!isReceipt && product?.stocks?.[location?.id] < quantity ? "row-alert" : ""}
                  >
                    <td>
                      <div className="cell-title">
                        <strong>{product?.name || "Unknown product"}</strong>
                        <small className="mono">{product?.sku}</small>
                      </div>
                    </td>
                    <td>{location?.name}</td>
                    <td>
                      <strong>{quantity}</strong> {product?.uom}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stockBlocked && (
            <div className="inline-alert">
              <AlertTriangle size={15} />
              One or more product lines do not have enough stock.
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}

/* ==========================================================================
   Internal Transfers & Adjustments
   ========================================================================== */
function Transfers({ state, update }) {
  const [form, setForm] = useState({ productId: "", quantity: "", from: "", to: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const change = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const sourceProduct = state.products.find((p) => p.id === form.productId);

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const qty = Number(form.quantity);
    if (!form.productId || !form.from || !form.to || !qty || qty < 0) {
      return setError("Select a product and valid quantity and locations.");
    }
    if (form.from === form.to) return setError("From and To locations must be different.");
    if ((sourceProduct?.stocks?.[form.from] || 0) < qty) {
      return setError("Insufficient stock at the source location.");
    }
    update((current) => {
      const product = current.products.find((p) => p.id === form.productId);
      product.stocks[form.from] = (product.stocks[form.from] || 0) - qty;
      product.stocks[form.to] = (product.stocks[form.to] || 0) + qty;
      return {
        ...current,
        transfers: [
          ...current.transfers,
          { id: uid("t"), productId: form.productId, quantity: qty, from: form.from, to: form.to, date: today },
        ],
        ledger: [
          {
            id: uid("m"),
            reference: `WH/INT/${String(current.ledger.length + 1).padStart(4, "0")}`,
            type: "Internal",
            contact: "Internal Transfer",
            status: "Done",
            date: today,
            from: locationLabel(current, form.from),
            to: locationLabel(current, form.to),
            productId: form.productId,
            quantity: qty,
            direction: "internal",
          },
          ...current.ledger,
        ],
      };
    });
    setNotice("Transfer recorded. Source stock decreased and destination stock increased.");
    setForm({ productId: "", quantity: "", from: "", to: "" });
  };

  return (
    <Page
      eyebrow="OPERATIONS / INTERNAL"
      title="Internal Transfers"
      description="Move stock between valid company locations without changing total stock."
      action={<span className="operation-rule">Every transfer is added to Move History</span>}
    >
      <div className="two-column">
        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEW TRANSFER</p>
              <h3>Move stock</h3>
              <p className="muted">Product + Quantity + From + To</p>
            </div>
          </div>
          <form onSubmit={submit} className="stack-form">
            <Field label="Product" required>
              <select value={form.productId} onChange={change("productId")}>
                <option value="">Select product</option>
                {state.products.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quantity" required>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={change("quantity")}
                placeholder="0"
              />
            </Field>
            <Field label="From location" required>
              <select value={form.from} onChange={change("from")}>
                <option value="">Select source</option>
                {state.locations.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name} · {l.code}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="To location" required>
              <select value={form.to} onChange={change("to")}>
                <option value="">Select destination</option>
                {state.locations.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name} · {l.code}
                  </option>
                ))}
              </select>
            </Field>
            {error && (
              <div className="form-error inline">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            {notice && (
              <div className="form-success">
                <Check size={16} />
                {notice}
              </div>
            )}
            <button className="button primary" type="submit">
              <ArrowLeftRight size={16} /> Record Transfer
            </button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECENT MOVES</p>
              <h3>Transfer history</h3>
            </div>
          </div>
          <div className="simple-list">
            {state.transfers.length ? (
              state.transfers
                .slice()
                .reverse()
                .map((t) => (
                  <div className="simple-row" key={t.id}>
                    <span className="direction-dot internal">
                      <ArrowLeftRight size={13} />
                    </span>
                    <div>
                      <strong>{state.products.find((p) => p.id === t.productId)?.name}</strong>
                      <small>
                        {locationLabel(state, t.from)} → {locationLabel(state, t.to)}
                      </small>
                    </div>
                    <b>{t.quantity}</b>
                  </div>
                ))
            ) : (
              <div className="empty-state">No internal transfers recorded yet.</div>
            )}
          </div>
        </section>
      </div>
    </Page>
  );
}

function Adjustments({ state, update }) {
  const [form, setForm] = useState({ productId: "", locationId: "", counted: "" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const product = state.products.find((p) => p.id === form.productId);
  const recorded = product?.stocks?.[form.locationId] ?? null;
  const change = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const counted = Number(form.counted);
    if (!form.productId || !form.locationId || form.counted === "" || counted < 0) {
      return setError("Select a product and location and enter a valid counted quantity.");
    }
    const delta = counted - recorded;
    update((current) => {
      const p = current.products.find((x) => x.id === form.productId);
      p.stocks[form.locationId] = counted;
      return {
        ...current,
        adjustments: [
          ...current.adjustments,
          { id: uid("a"), productId: form.productId, locationId: form.locationId, recorded, counted, delta, date: today },
        ],
        ledger: [
          {
            id: uid("m"),
            reference: `WH/ADJ/${String(current.ledger.length + 1).padStart(4, "0")}`,
            type: "Adjustment",
            contact: "Inventory Adjustment",
            status: "Done",
            date: today,
            from: "Stock record",
            to: locationLabel(current, form.locationId),
            productId: form.productId,
            quantity: Math.abs(delta),
            direction: delta >= 0 ? "in" : "out",
          },
          ...current.ledger,
        ],
      };
    });
    setNotice(`Stock updated to ${counted}. Adjustment ${delta >= 0 ? "+" : ""}${delta} logged.`);
    setForm({ productId: "", locationId: "", counted: "" });
  };

  return (
    <Page
      eyebrow="OPERATIONS / INVENTORY"
      title="Inventory Adjustments"
      description="Reconcile recorded stock with a physical count."
      action={<span className="operation-rule">Adjustments are traceable in Move History</span>}
    >
      <div className="two-column">
        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEW ADJUSTMENT</p>
              <h3>Update physical count</h3>
              <p className="muted">Recorded quantity becomes the counted quantity.</p>
            </div>
          </div>
          <form onSubmit={submit} className="stack-form">
            <Field label="Product" required>
              <select value={form.productId} onChange={change("productId")}>
                <option value="">Select product</option>
                {state.products.map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location" required>
              <select value={form.locationId} onChange={change("locationId")}>
                <option value="">Select location</option>
                {state.locations.map((l) => (
                  <option value={l.id} key={l.id}>
                    {l.name} · {l.code}
                  </option>
                ))}
              </select>
            </Field>
            <div className="count-preview">
              <span>Recorded quantity</span>
              <strong>{recorded === null ? "—" : recorded}</strong>
            </div>
            <Field label="Counted quantity" required>
              <input
                type="number"
                min="0"
                value={form.counted}
                onChange={change("counted")}
                placeholder="Enter physical count"
              />
            </Field>
            {recorded !== null && form.counted !== "" && (
              <div className={`delta ${Number(form.counted) - recorded >= 0 ? "positive" : "negative"}`}>
                Adjustment: {Number(form.counted) - recorded >= 0 ? "+" : ""}
                {Number(form.counted) - recorded}
              </div>
            )}
            {error && (
              <div className="form-error inline">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            {notice && (
              <div className="form-success">
                <Check size={16} />
                {notice}
              </div>
            )}
            <button className="button primary" type="submit">
              <ClipboardCheck size={16} /> Apply Adjustment
            </button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">ADJUSTMENT HISTORY</p>
              <h3>Recent adjustments</h3>
            </div>
          </div>
          <div className="simple-list">
            {state.adjustments.length ? (
              state.adjustments
                .slice()
                .reverse()
                .map((a) => (
                  <div className="simple-row" key={a.id}>
                    <span className={`direction-dot ${a.delta >= 0 ? "in" : "out"}`}>
                      {a.delta >= 0 ? <ArrowUpFromLine size={13} /> : <ArrowDownToLine size={13} />}
                    </span>
                    <div>
                      <strong>{state.products.find((p) => p.id === a.productId)?.name}</strong>
                      <small>
                        {locationLabel(state, a.locationId)} · {formatDate(a.date)}
                      </small>
                    </div>
                    <b className={a.delta >= 0 ? "positive-text" : "negative-text"}>
                      {a.delta >= 0 ? "+" : ""}
                      {a.delta}
                    </b>
                  </div>
                ))
            ) : (
              <div className="empty-state">No adjustments recorded yet.</div>
            )}
          </div>
        </section>
      </div>
    </Page>
  );
}

/* ==========================================================================
   Move History
   ========================================================================== */
function MoveHistory({ state }) {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("query") || searchParams.get("product") || "";
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState("list");

  useEffect(() => {
    const q = searchParams.get("query") || searchParams.get("product");
    if (q !== null) setQuery(q || "");
  }, [searchParams]);

  const rows = state.ledger.filter((row) => {
    const prod = state.products.find((p) => p.id === row.productId);
    const text = `${row.reference} ${row.contact} ${row.from} ${row.to} ${prod?.name || ""} ${prod?.sku || ""}`;
    return text.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <Page
      eyebrow="INVENTORY / AUDIT"
      title="Move History"
      description="A traceable record of every stock movement."
      action={
        <span className="ledger-note">
          <ClipboardList size={16} /> Stock ledger
        </span>
      }
    >
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, contact, or product name"
          />
        </div>
        <div className="view-toggle">
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <List size={16} /> List View
          </button>
          <button className={view === "kanban" ? "active" : ""} onClick={() => setView("kanban")}>
            <BarChart3 size={16} /> Kanban View
          </button>
        </div>
      </div>
      {view === "list" ? (
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Product</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={`movement-row ${row.direction}`}>
                    <td className="mono strong-text">{row.reference}</td>
                    <td>{state.products.find((p) => p.id === row.productId)?.name}</td>
                    <td>{row.contact}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.from}</td>
                    <td>{row.to}</td>
                    <td>
                      <strong>
                        {row.direction === "out" ? "−" : row.direction === "in" ? "+" : "↔"}
                        {row.quantity}
                      </strong>
                    </td>
                  </tr>
                ))}
                {!rows.length && <EmptyRow text="No movement records match your search." />}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="kanban">
          {["Done"].map((status) => (
            <section className="kanban-col" key={status}>
              <div className="kanban-heading">
                <span className="status-dot done" />
                Completed movements<span>{rows.length}</span>
              </div>
              {rows.map((row) => (
                <div className="kanban-card static" key={row.id}>
                  <strong>{row.reference}</strong>
                  <span>
                    {state.products.find((p) => p.id === row.productId)?.name} · {row.quantity}
                  </span>
                  <small>
                    {row.from} → {row.to}
                  </small>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </Page>
  );
}

/* ==========================================================================
   Settings: Warehouses & Locations
   ========================================================================== */
function Warehouses({ state, update }) {
  const [form, setForm] = useState({ name: "", code: "", address: "" });
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.address) return setError("Complete all warehouse fields.");
    if (state.warehouses.some((w) => w.code.toLowerCase() === form.code.toLowerCase())) {
      return setError("Short Code must be unique.");
    }
    update((current) => ({
      ...current,
      warehouses: [...current.warehouses, { ...form, id: uid("wh"), code: form.code.toUpperCase() }],
    }));
    setForm({ name: "", code: "", address: "" });
    setError("");
  };

  return (
    <Page
      eyebrow="SETTINGS"
      title="Warehouses"
      description="Manage the warehouses used in operation references and stock visibility."
      action={
        <span className="operation-rule">
          <Building2 size={16} /> Multi-warehouse enabled
        </span>
      }
    >
      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">WAREHOUSE DIRECTORY</p>
              <h3>{state.warehouses.length} warehouses</h3>
            </div>
          </div>
          <div className="directory-list">
            {state.warehouses.map((w) => (
              <div className="directory-row" key={w.id}>
                <span className="document-icon neutral">
                  <Building2 size={19} />
                </span>
                <div>
                  <strong>{w.name}</strong>
                  <small>
                    <span className="mono">{w.code}</span> · {w.address}
                  </small>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        </section>
        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADD WAREHOUSE</p>
              <h3>New warehouse</h3>
            </div>
          </div>
          <form onSubmit={submit} className="stack-form">
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Warehouse name"
              />
            </Field>
            <Field label="Short Code" required>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. WH"
                maxLength="6"
              />
            </Field>
            <Field label="Address" required>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Warehouse address"
                rows="3"
              />
            </Field>
            {error && (
              <div className="form-error inline">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            <button className="button primary">
              <Plus size={16} /> Add Warehouse
            </button>
          </form>
        </section>
      </div>
    </Page>
  );
}

function Locations({ state, update }) {
  const [form, setForm] = useState({ name: "", code: "", warehouseId: "" });
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.warehouseId) return setError("Complete all location fields.");
    update((current) => ({
      ...current,
      locations: [...current.locations, { ...form, id: uid("loc"), code: form.code.toUpperCase() }],
    }));
    setForm({ name: "", code: "", warehouseId: "" });
    setError("");
  };

  return (
    <Page
      eyebrow="SETTINGS"
      title="Locations"
      description="Manage stock-holding locations within each warehouse."
      action={
        <span className="operation-rule">
          <MapPin size={16} /> Location-aware stock
        </span>
      }
    >
      <div className="two-column">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">LOCATION DIRECTORY</p>
              <h3>{state.locations.length} locations</h3>
            </div>
          </div>
          <div className="directory-list">
            {state.locations.map((l) => (
              <div className="directory-row" key={l.id}>
                <span className="document-icon neutral">
                  <MapPin size={19} />
                </span>
                <div>
                  <strong>{l.name}</strong>
                  <small>
                    <span className="mono">{l.code}</span> · {state.warehouses.find((w) => w.id === l.warehouseId)?.name}
                  </small>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
        </section>
        <section className="panel form-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADD LOCATION</p>
              <h3>New location</h3>
            </div>
          </div>
          <form onSubmit={submit} className="stack-form">
            <Field label="Name" required>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Location name"
              />
            </Field>
            <Field label="Short Code" required>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. RACK-A"
              />
            </Field>
            <Field label="Warehouse" required>
              <select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
              >
                <option value="">Select warehouse</option>
                {state.warehouses.map((w) => (
                  <option value={w.id} key={w.id}>
                    {w.name} · {w.code}
                  </option>
                ))}
              </select>
            </Field>
            {error && (
              <div className="form-error inline">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
            <button className="button primary">
              <Plus size={16} /> Add Location
            </button>
          </form>
        </section>
      </div>
    </Page>
  );
}

function Profile({ state, logout }) {
  const navigate = useNavigate();
  return (
    <Page eyebrow="ACCOUNT" title="My Profile" description="Your StockSense account information.">
      <section className="panel profile-card">
        <div className="profile-header">
          <div className="avatar large-avatar">{state.user.loginId.slice(0, 2).toUpperCase()}</div>
          <div>
            <p className="eyebrow">CURRENT USER</p>
            <h2>{state.user.loginId}</h2>
            <p className="muted">{state.user.email}</p>
          </div>
        </div>
        <div className="metadata-grid profile-meta">
          <Meta label="Login Id" value={state.user.loginId} />
          <Meta label="Email Id" value={state.user.email} />
        </div>
        <div className="profile-footer">
          <button
            className="button danger-outline"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </section>
    </Page>
  );
}

/* ==========================================================================
   Form & Layout Components
   ========================================================================== */
function Field({ label, children, required }) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <b>*</b>}
      </span>
      {children}
    </label>
  );
}

function Select({ label, options, value, onChange }) {
  return (
    <label className="select-wrap">
      {label && <span>{label}</span>}
      <select value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

function Meta({ label, value }) {
  return (
    <div className="meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = status.toLowerCase().replaceAll(" ", "-");
  return (
    <span className={`status-badge ${normalized}`}>
      <i />
      {status}
    </span>
  );
}

function DateLabel({ date, status }) {
  const late = date < today && !["Done", "Canceled"].includes(status);
  return (
    <span className={late ? "date-late" : ""}>
      {formatDate(date)}
      {late && <small>Late</small>}
    </span>
  );
}

function EmptyRow({ text }) {
  return (
    <tr>
      <td colSpan="10">
        <div className="empty-state">{text}</div>
      </td>
    </tr>
  );
}

function buildNotifications(state) {
  const lowStock = state.products.filter((product) => totalStock(product) <= product.reorder);
  const lateOperations = [...state.receipts, ...state.deliveries].filter(
    (operation) => operation.date < today && !["Done", "Canceled"].includes(operation.status)
  );
  const waitingDeliveries = state.deliveries.filter((delivery) => delivery.status === "Waiting");
  return [
    lowStock.length && {
      id: "low-stock",
      type: "stock",
      title: `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} need attention`,
      detail: lowStock.slice(0, 2).map((product) => product.name).join(", "),
      link: "/products?filter=low",
    },
    lateOperations.length && {
      id: "late-operations",
      type: "late",
      title: `${lateOperations.length} late operation${lateOperations.length === 1 ? "" : "s"}`,
      detail: lateOperations.slice(0, 2).map((operation) => operation.reference).join(", "),
      link: "/dashboard",
    },
    waitingDeliveries.length && {
      id: "waiting-deliveries",
      type: "waiting",
      title: `${waitingDeliveries.length} ${waitingDeliveries.length === 1 ? "delivery" : "deliveries"} waiting for stock`,
      detail: waitingDeliveries.slice(0, 2).map((delivery) => delivery.reference).join(", "),
      link: "/operations/deliveries?status=Waiting",
    },
  ].filter(Boolean);
}

function applyOperation(current, item, type) {
  const collection = type === "receipt" ? "receipts" : "deliveries";
  const productIds = new Set();
  item.lines.forEach((line) => {
    const product = current.products.find((p) => p.id === line.productId);
    if (!product) return;
    product.stocks[line.locationId] =
      (product.stocks[line.locationId] || 0) + (type === "receipt" ? line.quantity : -line.quantity);
    productIds.add(product.id);
  });
  return {
    ...current,
    [collection]: current[collection].map((entry) => (entry.id === item.id ? { ...entry, status: "Done" } : entry)),
    ledger: [
      ...item.lines.map((line) => ({
        id: uid("m"),
        reference: item.reference,
        type: type === "receipt" ? "Receipt" : "Delivery",
        contact: item.contact,
        status: "Done",
        date: today,
        from: type === "receipt" ? "Vendor" : locationLabel(current, line.locationId),
        to: type === "receipt" ? locationLabel(current, line.locationId) : "Customer",
        productId: line.productId,
        quantity: line.quantity,
        direction: type === "receipt" ? "in" : "out",
      })),
      ...current.ledger,
    ],
  };
}

function unique(values) {
  return [...new Set(values)];
}

function locationLabel(state, id) {
  const location = state.locations.find((l) => l.id === id);
  const warehouse = state.warehouses.find((w) => w.id === location?.warehouseId);
  return location ? `${warehouse?.code || ""} / ${location.name}` : "Unknown location";
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default App;