import Api from "@services/api";

export async function deletePicture(pictureId: number): Promise<void> {
  const api = await Api.getInstance();
  await api.delete({
    url: `/pictures/${pictureId}`,
  });
}
