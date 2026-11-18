import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  Building2,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Command,
  House,
  ListTodo,
  LoaderCircle,
  Search,
  Settings2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { api } from "./lib";
import type { AiState, ModalState, Snapshot } from "./types";
import { AppContext } from "./context";
import { Avatar, Button, IconButton, Modal } from "./components/ui";
import { DashboardPage } from "./Dashboard";
import { PipelinePage } from "./Pipeline";
import { AccountPage, RelationshipsPage } from "./Relationships";
import { WorkPage } from "./Work";
import { DealPage } from "./Deal";
import { AiView } from "./Ai";
import { WorkspaceModals } from "./Modals";

const nav = [
  { to: "/", label: "Overview", icon: House },
  { to: "/pipeline", label: "Pipeline", icon: ChartNoAxesCombined },
  { to: "/relationships", label: "Relationships", icon: Users },
  { to: "/work", label: "My work", icon: ListTodo },
];
export default function App() {
  const queryClient = useQueryClient(),
    location = useLocation(),
    navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const period = ["quarter", "month", "all"].includes(
    params.get("period") || "",
  )
    ? params.get("period")!
    : "quarter";
  const owner = params.get("owner") || "all";
  const [modal, setModal] = useState<ModalState>(null),
    [ai, setAi] = useState<AiState | null>(null);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    action?: { label: string; run: () => void };
  } | null>(null);
  const { data, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["workspace", period, owner],
    queryFn: () =>
      api<Snapshot>(
        `/workspace?period=${period}&owner=${encodeURIComponent(owner)}`,
      ),
    placeholderData: keepPreviousData,
  });
  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["workspace"] });
  };
  const notify = (
    message: string,
    action?: { label: string; run: () => void },
  ) => setToast({ id: Date.now(), message, action });
  const setFilters = (p: string, o: string) => {
    const next = new URLSearchParams(params);
    next.set("period", p);
    next.set("owner", o);
    setParams(next);
  };
  useEffect(() => {
    if (!toast || toast.action) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setModal({ type: "search" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);
  if (!data)
    return (
      <div className="boot-screen">
        <img src="/favicon.svg" alt="JCRM" width="44" />
        <h1>A little clarity is on its way.</h1>
        {isError ? (
          <>
            <p>{error.message}</p>
            <Button onClick={() => refetch()}>Try again</Button>
          </>
        ) : (
          <LoaderCircle className="spin" size={23} />
        )}
      </div>
    );
  const person = data.members[0];
  const pending = data.tasks.filter(
    (t) => !t.completed && t.dueDate <= data.workspace.today,
  ).length;
  const currentNav = nav.find(
    (n) => n.to !== "/" && location.pathname.startsWith(n.to),
  );
  const breadcrumb = location.pathname.startsWith("/deals")
    ? "Opportunity"
    : location.pathname.startsWith("/accounts")
      ? "Account"
      : location.pathname === "/ai"
        ? "Juno AI"
        : currentNav?.label || "Overview";
  const navSearch = `?period=${period}&owner=${owner}`;
  return (
    <AppContext.Provider
      value={{
        data,
        period,
        owner,
        setFilters,
        openModal: setModal,
        openAI: setAi,
        notify,
        refresh,
      }}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <Link className="brand" to="/" aria-label="JCRM overview">
            <img src="/favicon.svg" alt="" />
            <span>
              jcrm<span className="brand-dot">.</span>
            </span>
            <span className="demo-tag">DEMO</span>
          </Link>
          <button
            className="workspace-picker"
            onClick={() => setModal({ type: "settings" })}
          >
            <span className="workspace-symbol">
              <Building2 size={17} />
            </span>
            <span>
              Acme workspace<small>Your team's workspace</small>
            </span>
            <ChevronDown size={15} />
          </button>
          <div className="nav-label">WORKSPACE</div>
          <nav className="desktop-nav" aria-label="Main navigation">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to + navSearch} end={to === "/"} aria-label={label}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
                {label === "My work" && pending > 0 && (
                  <span className="nav-count">{pending}</span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="nav-divider" />
          <button
            className="nav-ai"
            aria-label="Juno AI"
            onClick={() => setAi({ action: "briefing" })}
          >
            <Sparkles size={19} />
            <span>Juno AI</span>
            <span className="new-label">NEW</span>
          </button>
          <div className="sidebar-bottom">
            <div className="sidebar-ai-card">
              <span className="orb-mini" />
              <span className="sidebar-ai-kicker">YOUR MOMENTUM PARTNER</span>
              <h3>
                A little AI.
                <br />A lot of possibility.
              </h3>
              <p>Less busywork. More meaningful connections.</p>
              <button onClick={() => setAi({ action: "briefing" })}>
                Meet Juno <ArrowUpRight size={16} />
              </button>
            </div>
            <button
              className="sidebar-utility"
              onClick={() => setModal({ type: "tour" })}
            >
              <CircleHelp size={18} />A quick look around
              <ArrowUpRight size={14} />
            </button>
            <button
              className="sidebar-utility"
              onClick={() => setModal({ type: "settings" })}
            >
              <Settings2 size={18} />
              Workspace settings
            </button>
            <div className="sidebar-user">
              <Avatar person={person} />
              <span>
                {person.name}
                <small>{person.role}</small>
              </span>
              <button
                aria-label="Your workspace settings"
                onClick={() => setModal({ type: "settings" })}
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        </aside>
        <div className="workspace-main">
          <header className="topbar">
            <div className="breadcrumbs">
              <span className="mobile-brand">
                <img src="/favicon.svg" alt="JCRM" />
              </span>
              <span className="breadcrumb-workspace">Workspace</span>
              <ChevronRight size={14} />
              <span>{breadcrumb}</span>
              {isFetching && (
                <LoaderCircle
                  aria-label="Updating workspace"
                  size={13}
                  className="spin fetching"
                />
              )}
            </div>
            <div className="header-actions">
              <button
                aria-label="Search the workspace"
                className="search-trigger"
                onClick={() => setModal({ type: "search" })}
              >
                <Search size={16} />
                <span>Search anything...</span>
                <kbd>
                  <Command size={10} /> K
                </kbd>
              </button>
              <Button
                className="ask-juno"
                variant="ghost"
                onClick={() => setAi({ action: "briefing" })}
              >
                <Sparkles size={16} />
                Ask Juno
              </Button>
              <span className="header-divider" />
              <IconButton
                label={`Notifications, ${pending} tasks need attention`}
                onClick={() => setModal({ type: "notifications" })}
              >
                <Bell size={19} />
                {pending > 0 && <i className="notification-dot" />}
              </IconButton>
              <button
                className="header-avatar"
                onClick={() => setModal({ type: "settings" })}
                aria-label="Your profile"
              >
                <Avatar person={person} />
              </button>
            </div>
          </header>
          {isError && (
            <div className="connection-banner" role="alert">
              Couldn't update this view. Your saved data is still shown.{" "}
              <button onClick={() => refetch()}>Retry</button>
            </div>
          )}
          <main id="main-content" className="page-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/pipeline" element={<PipelinePage />} />
              <Route path="/relationships" element={<RelationshipsPage />} />
              <Route path="/accounts/:id" element={<AccountPage />} />
              <Route path="/deals/:id" element={<DealPage />} />
              <Route path="/work" element={<WorkPage />} />
              <Route path="/ai" element={<AiView />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h1>Let's get you back on track.</h1>
                    <Button onClick={() => navigate("/")}>
                      Back to overview
                    </Button>
                  </div>
                }
              />
            </Routes>
            <footer className="page-footer">
              <span>
                <span className="status-dot" />
                All your relationships. Moving forward.
              </span>
              <span>Made for the human side of business.</span>
            </footer>
          </main>
        </div>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to + navSearch} end={to === "/"}>
              <Icon size={20} />
              <span>
                {label === "Relationships"
                  ? "People"
                  : label === "Overview"
                    ? "Home"
                    : label}
              </span>
            </NavLink>
          ))}
          <NavLink to="/ai">
            <Sparkles size={20} />
            <span>Juno</span>
          </NavLink>
        </nav>
      </div>
      <WorkspaceModals modal={modal} onClose={() => setModal(null)} />
      <Modal
        open={!!ai}
        onClose={() => setAi(null)}
        title="A little help from Juno"
        description="Your context. Clearer next steps."
        className="ai-dialog"
      >
        {ai && <AiView initial={ai} onNavigate={() => setAi(null)} />}
      </Modal>
      <div
        className="toast-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toast && (
          <div className="toast">
            <span className="toast-check">
              <Check size={16} />
            </span>
            <span>{toast.message}</span>
            {toast.action && (
              <button
                className="toast-action"
                onClick={() => {
                  toast.action!.run();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <IconButton
              label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <X size={15} />
            </IconButton>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
