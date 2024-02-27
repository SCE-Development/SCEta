export const formatTimeToDate = (time) => {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
};
