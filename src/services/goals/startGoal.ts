import Api from "@services/api";

interface StartGoalResponse {
  goalId: number;
  message: string;
}

export async function startGoals(
  museumId: number,
  latitude: number,
  longitude: number
): Promise<number> {
  const api = await Api.getInstance();
  const res = await api.post<void, StartGoalResponse>(
    undefined,
    { url: `/goals/start/${museumId}?latitude=${latitude}&longitude=${longitude}` }
  );

  return res.data.goalId;
}
