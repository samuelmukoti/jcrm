import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronRight,
  ListTodo,
  LoaderCircle,
  Pencil,
  Plus,
} from "lucide-react";
import { useApp } from "./context";
import { date, write } from "./lib";
import { Avatar, Button, Empty, IconButton, Panel } from "./components/ui";
import { PageHeading, WorkspaceFilters } from "./Dashboard";
import type { Task } from "./types";

export function TaskRow({
  task,
  compact = false,
}: {
  task: Task;
  compact?: boolean;
}) {
  const { data, refresh, notify, openModal } = useApp();
  const account = data.accounts.find((a) => a.id === task.accountId),
    owner = data.members.find((m) => m.id === task.ownerId);
  const mutation = useMutation({
    mutationFn: () =>
      write(
        `/tasks/${task.id}`,
        { ...task, requestKey: null, completed: !task.completed },
        "PUT",
      ),
    onSuccess: async () => {
      await refresh();
      notify(
        task.completed
          ? "Task reopened. Back in motion."
          : "One less thing. Task complete.",
      );
    },
    onError: (e) => notify(e.message),
  });
  return (
    <div
      className={`task-row ${compact ? "compact" : ""} ${task.completed ? "completed" : ""}`}
    >
      <button
        className="task-check"
        aria-label={`${task.completed ? "Reopen" : "Complete"} ${task.title}`}
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <LoaderCircle size={12} className="spin" />
        ) : task.completed ? (
          <Check size={13} />
        ) : null}
      </button>
      <div className="task-details">
        <Link
          to={
            task.dealId
              ? `/deals/${task.dealId}`
              : `/accounts/${task.accountId}`
          }
        >
          {task.title}
        </Link>
        <span>
          {account?.name}
          <i />
          {task.dueDate < data.workspace.today ? (
            <span className="overdue">Overdue</span>
          ) : task.dueDate === data.workspace.today ? (
            "Today"
          ) : (
            date(task.dueDate)
          )}
        </span>
      </div>
      {!compact && (
        <>
          <span className="task-due">
            <CalendarDays size={14} />
            {date(task.dueDate)}
          </span>
          <Avatar person={owner} size="xs" />
          <IconButton
            label={`Edit task: ${task.title}`}
            onClick={() => openModal({ type: "task", id: task.id })}
          >
            <Pencil size={15} />
          </IconButton>
        </>
      )}
      {compact && <ChevronRight className="task-row-arrow" size={14} />}
    </div>
  );
}
export function WorkPage() {
  const { data, owner, openModal } = useApp(),
    [tab, setTab] = useState("All open");
  const tasks = data.tasks
    .filter((t) => owner === "all" || t.ownerId === owner)
    .filter((t) =>
      tab === "Completed"
        ? t.completed
        : !t.completed &&
          (tab === "Today"
            ? t.dueDate === data.workspace.today
            : tab === "Overdue"
              ? t.dueDate < data.workspace.today
              : true),
    );
  const due = data.tasks.filter(
    (t) =>
      !t.completed &&
      t.dueDate <= data.workspace.today &&
      (owner === "all" || t.ownerId === owner),
  ).length;
  return (
    <>
      <PageHeading
        eyebrow="SMALL STEPS. REAL PROGRESS."
        title="Make room for what matters."
        description="A clear view of your next moves, all in one place."
      >
        <Button variant="primary" onClick={() => openModal({ type: "task" })}>
          <Plus size={17} />
          New task
        </Button>
      </PageHeading>
      <div className="work-intro">
        <span className="work-intro-icon">
          <ListTodo size={24} />
        </span>
        <div>
          <h2>
            {due
              ? `${due} things to move forward today.`
              : "A little breathing room."}
          </h2>
          <p>
            Every follow-up is another chance to build a better relationship.
          </p>
        </div>
        <span className="work-date">
          {date(data.workspace.today, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="list-toolbar">
        <div className="tabs">
          {["All open", "Today", "Overdue", "Completed"].map((t) => (
            <button
              className={tab === t ? "active" : ""}
              key={t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <WorkspaceFilters />
      </div>
      <Panel
        title={
          tab === "Completed" ? "Good work, well done." : "Your next steps"
        }
        subtitle={`${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
      >
        <div className="work-task-list">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
          {!tasks.length && (
            <Empty
              title={
                tab === "Completed"
                  ? "Your next win is waiting."
                  : "You're all clear."
              }
            >
              Add a next step or explore another view.
            </Empty>
          )}
        </div>
      </Panel>
    </>
  );
}
