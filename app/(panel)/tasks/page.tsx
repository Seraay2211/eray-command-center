import { TasksClient } from "@/components/tasks/tasks-client";
import { getCategories } from "@/features/notes/actions";
import {
  getTaskById,
  getTasks,
} from "@/services/tasks-service";
import { getUserSettings } from "@/services/settings-service";

export const metadata = {
  title: "Görevler",
};

export const dynamic = "force-dynamic";

interface TasksPageProps {
  searchParams: Promise<{
    new?: string;
    task?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const [tasksResult, categoriesResult, settingsResult, query] = await Promise.all([
    getTasks({ limit: 50 }),
    getCategories(),
    getUserSettings(),
    searchParams,
  ]);
  const selectedTaskMissing =
    Boolean(query.task) &&
    !(tasksResult.data ?? []).some((task) => task.id === query.task);
  const selectedTaskResult =
    selectedTaskMissing && query.task ? await getTaskById(query.task) : null;
  const initialTasks = selectedTaskResult?.data
    ? [selectedTaskResult.data, ...(tasksResult.data ?? [])]
    : (tasksResult.data ?? []);

  return (
    <TasksClient
      initialCategories={categoriesResult.data ?? []}
      initialDefaultPriority={
        settingsResult.data?.default_task_priority ?? "medium"
      }
      initialDefaultStatus={settingsResult.data?.default_task_status ?? "todo"}
      initialError={tasksResult.error ?? categoriesResult.error ?? ""}
      initialTaskId={query.task ?? ""}
      initialNow={new Date().toISOString()}
      initialOpen={query.new === "1" || Boolean(query.task)}
      initialTasks={initialTasks}
      key={[query.new ?? "", query.task ?? "", tasksResult.error ?? ""].join("|")}
    />
  );
}
