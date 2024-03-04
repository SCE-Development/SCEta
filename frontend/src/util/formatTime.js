export const formatTime = (time) => {
  const [hours, minutes] = time.split(':');
  const formattedHours = (parseInt(hours, 10) % 12) || 12;
  const period = parseInt(hours, 10) < 12 ? 'AM' : 'PM';
  return `${formattedHours}:${minutes} ${period}`;
};
