import {
  apiRequest,
  publicApiRequest,
} from "./api";


export function getScheduleBookings(
  weekStart = ""
) {
  const query = weekStart
    ? `?weekStart=${encodeURIComponent(
        weekStart
      )}`
    : "";

  return apiRequest(
    `/api/admin/schedule/${query}`
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


export function getClassOfferings() {
  return apiRequest(
    "/api/admin/schedule/offerings/"
  );
}


export function createClassOffering(
  offeringData
) {
  return apiRequest(
    "/api/admin/schedule/offerings/",
    {
      method: "POST",
      body: offeringData,
    }
  );
}


export function updateClassOffering(
  offeringId,
  offeringData
) {
  return apiRequest(
    `/api/admin/schedule/offerings/${
      offeringId
    }/`,
    {
      method: "PATCH",
      body: offeringData,
    }
  );
}


export function deleteClassOffering(
  offeringId
) {
  return apiRequest(
    `/api/admin/schedule/offerings/${
      offeringId
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
