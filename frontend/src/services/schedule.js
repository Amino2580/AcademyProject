import {
  apiRequest,
} from "./api";


export function getScheduleBookings() {
  return apiRequest(
    "/api/admin/schedule/"
  );
}


export function createScheduleBooking(
  bookingData
) {
  return apiRequest(
    "/api/admin/schedule/",
    {
      method: "POST",
      body: bookingData,
    }
  );
}


export function updateScheduleBooking(
  bookingId,
  bookingData
) {
  return apiRequest(
    `/api/admin/schedule/${bookingId}/`,
    {
      method: "PATCH",
      body: bookingData,
    }
  );
}


export function deleteScheduleBooking(
  bookingId
) {
  return apiRequest(
    `/api/admin/schedule/${bookingId}/`,
    {
      method: "DELETE",
    }
  );
}