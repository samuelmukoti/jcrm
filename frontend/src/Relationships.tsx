import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  ChevronDown,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useApp } from "./context";
import { money } from "./lib";
import {
  Avatar,
  Button,
  CompanyLogo,
  Empty,
  IconButton,
  Panel,
} from "./components/ui";
import { DealRows, PageHeading } from "./Dashboard";

export function RelationshipsPage() {
  const { data, openModal } = useApp(),
    navigate = useNavigate();
  const [tab, setTab] = useState("Accounts"),
    [search, setSearch] = useState(""),
    [industry, setIndustry] = useState("all");
  const accounts = data.accounts.filter(
    (a) =>
      `${a.name} ${a.industry} ${a.location}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (industry === "all" || a.industry === industry),
  );
  const contacts = data.contacts.filter(
    (c) =>
      `${c.name} ${c.email} ${data.accounts.find((a) => a.id === c.accountId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (industry === "all" ||
        data.accounts.find((a) => a.id === c.accountId)?.industry === industry),
  );
  return (
    <>
      <PageHeading
        eyebrow="PEOPLE FIRST. ALWAYS."
        title="Relationships worth building."
        description="The companies, people, and conversations at the heart of your business."
      >
        <Button onClick={() => openModal({ type: "contact" })}>
          <Plus size={16} />
          Add contact
        </Button>
        <Button
          variant="primary"
          onClick={() => openModal({ type: "account" })}
        >
          <Plus size={17} />
          New account
        </Button>
      </PageHeading>
      <div className="relationship-stats">
        <div>
          <span className="stat-symbol purple">
            <Building2 size={21} />
          </span>
          <span>
            <strong>{data.accounts.length}</strong>companies with potential
          </span>
        </div>
        <div>
          <span className="stat-symbol green">
            <Users size={21} />
          </span>
          <span>
            <strong>{data.contacts.length}</strong>people to connect with
          </span>
        </div>
        <p>
          Great things start
          <br />
          <strong>with a conversation.</strong>
        </p>
      </div>
      <div className="list-toolbar">
        <div className="tabs">
          {["Accounts", "Contacts"].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
              <span>
                {t === "Accounts" ? data.accounts.length : data.contacts.length}
              </span>
            </button>
          ))}
        </div>
        <div className="directory-tools">
          <div className="search-field">
            <Search size={16} />
            <input
              aria-label="Search relationships"
              placeholder="Find your people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <label className="filter-select">
            <select
              aria-label="Filter industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="all">All industries</option>
              {[...new Set(data.accounts.map((a) => a.industry))].map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
        </div>
      </div>
      {tab === "Accounts" ? (
        <div className="accounts-grid">
          {accounts.map((a) => {
            const owner = data.members.find((m) => m.id === a.ownerId),
              deals = data.deals.filter((d) => d.accountId === a.id);
            return (
              <button
                key={a.id}
                className="account-card"
                onClick={() => navigate(`/accounts/${a.id}`)}
              >
                <span className="account-card-top">
                  <CompanyLogo account={a} size="lg" />
                  <span className={`account-status ${a.status.toLowerCase()}`}>
                    {a.status}
                  </span>
                  <ArrowUpRight size={16} />
                </span>
                <h2>{a.name}</h2>
                <p>{a.industry}</p>
                <span className="account-card-location">
                  <MapPin size={13} />
                  {a.location}
                </span>
                <span className="account-card-bottom">
                  <span>
                    {deals.length}{" "}
                    {deals.length === 1 ? "opportunity" : "opportunities"}
                  </span>
                  <Avatar person={owner} size="xs" />
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="panel contacts-list">
          {contacts.map((c) => (
            <div className="contact-row" key={c.id}>
              <Avatar person={c} />
              <button
                className="contact-name"
                onClick={() => openModal({ type: "contact", id: c.id })}
              >
                <strong>{c.name}</strong>
                <small>{c.jobTitle}</small>
              </button>
              <Link to={`/accounts/${c.accountId}`}>
                {data.accounts.find((a) => a.id === c.accountId)?.name}
              </Link>
              <span className="contact-email">{c.email}</span>
              <IconButton
                label={`Edit ${c.name}`}
                onClick={() => openModal({ type: "contact", id: c.id })}
              >
                <Pencil size={15} />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      {!(tab === "Accounts" ? accounts : contacts).length && (
        <Empty title="No relationships match that search." search>
          Try a company, person, or a broader filter.
        </Empty>
      )}
    </>
  );
}
export function AccountPage() {
  const { id } = useParams(),
    { data, openModal } = useApp();
  const a = data.accounts.find((a) => a.id === id);
  if (!a)
    return (
      <Empty title="This account isn't available.">
        <Link to="/relationships">Back to relationships</Link>
      </Empty>
    );
  const contacts = data.contacts.filter((c) => c.accountId === id),
    deals = data.deals.filter((d) => d.accountId === id),
    activities = data.activities.filter((x) => x.accountId === id);
  return (
    <>
      <Link className="back-link" to="/relationships">
        <ArrowLeft size={15} />
        All relationships
      </Link>
      <div className="record-heading">
        <CompanyLogo account={a} size="lg" />
        <div>
          <span className="eyebrow">A RELATIONSHIP WITH POTENTIAL</span>
          <h1>{a.name}</h1>
          <p>
            {a.industry} <span>·</span> {a.location}
          </p>
        </div>
        <Button onClick={() => openModal({ type: "account", id: a.id })}>
          <Pencil size={15} />
          Edit account
        </Button>
      </div>
      <div className="account-detail-grid">
        <div>
          <Panel
            title="The bigger picture"
            subtitle="A little context goes a long way"
          >
            <p className="account-description">{a.description}</p>
            <div className="account-facts">
              <span>
                <Globe size={16} />
                {a.website}
              </span>
              <span>
                <Users size={16} />
                {a.employees.toLocaleString()} employees
              </span>
              <span>
                <MapPin size={16} />
                {a.location}
              </span>
            </div>
          </Panel>
          <Panel
            title="Opportunities together"
            subtitle={`${money(deals.reduce((n, d) => n + d.amountCents, 0))} across ${deals.length} opportunities`}
            action={
              <Button
                variant="ghost"
                onClick={() => openModal({ type: "deal", accountId: a.id })}
              >
                <Plus size={16} />
                New deal
              </Button>
            }
          >
            <DealRows deals={deals} compact />
          </Panel>
          <Panel
            title="The conversation so far"
            action={
              <Button
                variant="ghost"
                onClick={() => openModal({ type: "activity", accountId: a.id })}
              >
                <Plus size={15} />
                Add note
              </Button>
            }
          >
            <div className="account-activity">
              {activities.slice(0, 6).map((x) => (
                <div key={x.id}>
                  <span className="activity-icon">
                    <Mail size={15} />
                  </span>
                  <div>
                    <strong>{x.title}</strong>
                    <p>{x.body}</p>
                  </div>
                </div>
              ))}
              {!activities.length && (
                <Empty title="Start the conversation.">
                  Add a note to keep your team in the loop.
                </Empty>
              )}
            </div>
          </Panel>
        </div>
        <div>
          <Panel
            title="The people behind it"
            subtitle={`${contacts.length} connections`}
            action={
              <IconButton
                label="Add account contact"
                onClick={() => openModal({ type: "contact", accountId: a.id })}
              >
                <Plus size={17} />
              </IconButton>
            }
          >
            <div className="account-contacts">
              {contacts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openModal({ type: "contact", id: c.id })}
                >
                  <Avatar person={c} />
                  <span>
                    <strong>{c.name}</strong>
                    <small>{c.jobTitle}</small>
                    <small>{c.email}</small>
                  </span>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </Panel>
          <div className="relationship-note">
            <Users size={25} />
            <h3>
              Behind every account,
              <br />
              there's a person.
            </h3>
            <p>A little context helps you make every conversation count.</p>
          </div>
        </div>
      </div>
    </>
  );
}
