import Api from "@services/api";
import { GoalResponse } from "@interfaces/goal/goalResponse";

export async function getGoals(museumId: number): Promise<GoalResponse> {
  const api = await Api.getInstance();
  const response = await api.get<void, GoalResponse>({
    url: `/goals/${museumId}`,
  });
  return response.data;
}
