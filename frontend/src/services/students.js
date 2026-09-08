import {
  apiRequest,
} from "./api";


export function getStudents({
  page = 1,
  search = "",
  level = "",
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    isActive: "true",
  });

  if (search.trim()) {
    params.set(
      "search",
      search.trim()
    );
  }

  if (level) {
    params.set(
      "level",
      level
    );
  }

  return apiRequest(
    `/api/admin/students/?${params.toString()}`
  );
}


export function createStudent(studentData) {
  return apiRequest(
    "/api/admin/students/",
    {
      method: "POST",
      body: studentData,
    }
  );
}


export function updateStudent(
  studentId,
  studentData
) {
  return apiRequest(
    `/api/admin/students/${studentId}/`,
    {
      method: "PATCH",
      body: studentData,
    }
  );
}


export function deleteStudent(studentId) {
  return apiRequest(
    `/api/admin/students/${studentId}/`,
    {
      method: "DELETE",
    }
  );
}