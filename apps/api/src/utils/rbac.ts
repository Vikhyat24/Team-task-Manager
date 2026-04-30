export const canEditTask = (
  userId: string,
  task: { createdById: string; assigneeId: string | null },
  membershipRole: string
) => {
  if (membershipRole === 'ADMIN') return true;
  if (task.createdById === userId) return true;
  return false;
};

export const canChangeTaskStatus = (
  userId: string,
  task: { createdById: string; assigneeId: string | null },
  membershipRole: string
) => {
  if (canEditTask(userId, task, membershipRole)) return true;
  if (task.assigneeId === userId) return true;
  return false;
};
