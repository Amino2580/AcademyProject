import { apiRequest } from "./api";


export function getDashboardSummary() {
  return apiRequest(
    "/api/admin/dashboard/"
  );
}