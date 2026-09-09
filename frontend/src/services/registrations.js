import { apiRequest } from "./api";


export function getRegistrationRequests(
  page = 1
) {
  return apiRequest(
    `/api/admin/registrations/?page=${page}`
  );
}


export function updateRegistrationStatus(
  registrationId,
  status
) {
  return apiRequest(
    `/api/admin/registrations/${registrationId}/`,
    {
      method: "PATCH",
      body: {
        status,
      },
    }
  );
}