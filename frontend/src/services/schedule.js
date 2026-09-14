import {
  apiRequest,
  publicApiRequest,
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


export function getWeeklyAvailability() {
  return apiRequest(
    "/api/admin/schedule/availability/"
  );
}


export function createWeeklyAvailability(
  availabilityData
) {
  return apiRequest(
    "/api/admin/schedule/availability/",
    {
      method: "POST",
      body: availabilityData,
    }
  );
}


export function updateWeeklyAvailability(
  availabilityId,
  availabilityData
) {
  return apiRequest(
    `/api/admin/schedule/availability/${
      availabilityId
    }/`,
    {
      method: "PATCH",
      body: availabilityData,
    }
  );
}


export function deleteWeeklyAvailability(
  availabilityId
) {
  return apiRequest(
    `/api/admin/schedule/availability/${
      availabilityId
    }/`,
    {
      method: "DELETE",
    }
  );
}


export function getAvailabilityExceptions() {
  return apiRequest(
    "/api/admin/schedule/exceptions/"
  );
}


export function createAvailabilityException(
  exceptionData
) {
  return apiRequest(
    "/api/admin/schedule/exceptions/",
    {
      method: "POST",
      body: exceptionData,
    }
  );
}


export function updateAvailabilityException(
  exceptionId,
  exceptionData
) {
  return apiRequest(
    `/api/admin/schedule/exceptions/${
      exceptionId
    }/`,
    {
      method: "PATCH",
      body: exceptionData,
    }
  );
}


export function deleteAvailabilityException(
  exceptionId
) {
  return apiRequest(
    `/api/admin/schedule/exceptions/${
      exceptionId
    }/`,
    {
      method: "DELETE",
    }
  );
}


export function getPublicScheduleAvailability(
  weekStart = ""
) {
  const query = weekStart
    ? `?weekStart=${encodeURIComponent(
        weekStart
      )}`
    : "";

  return publicApiRequest(
    `/api/schedule/availability/${query}`
  );
}


export function getMySchedule() {
  return apiRequest(
    "/api/schedule/mine/"
  );
}