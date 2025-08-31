import Api from "@services/api";
import { GoalResponseDto } from "@interfaces/goal/goalResponse";

export async function getGoals(museumId: number): Promise<GoalResponseDto> {
  const api = await Api.getInstance();
  const res = await api.get<void, GoalResponseDto>({ url: `/goals/${museumId}` });
  return res.data;
}