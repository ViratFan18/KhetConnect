export const queryKeys = {
  jobs: {
    all: ['jobs'],
    nearby: ['jobs', 'nearby'],
    myPosts: ['jobs', 'myPosts'],
    applicants: (jobId) => ['jobs', 'applicants', jobId],
  },
  bookings: ['bookings'],
  history: {
    farmer: ['history', 'farmer'],
    labourer: ['history', 'labourer'],
    ratings: (userId) => ['history', 'ratings', userId],
  },
  notifications: ['notifications'],
}
