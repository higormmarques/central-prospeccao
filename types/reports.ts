export type OperationalKpis = {
  totalLeads: number;
  activeLeads: number;
  tasksCompleted: number;
  overdueTasks: number;
  interactionsCount: number;
  responseRate: number;
};

export type CampaignSummary = {
  id: string;
  name: string;
  status: string;
  totalLeads: number;
  activeLeads: number;
  closedLeads: number;
};

export type ClosingReasonCount = {
  name: string;
  count: number;
};
