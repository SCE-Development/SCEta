export const formatDateToTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
};
