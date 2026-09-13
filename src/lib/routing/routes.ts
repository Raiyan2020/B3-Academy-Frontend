export const routes = {
  home: '/',
  auth: '/auth',
  education: '/education',
  search: '/search',
  subscriptions: '/subscriptions',
  community: '/community',
  terms: '/terms',
  ratings: '/ratings',
  courses: '/courses',
  courseDetail: (courseId: string) => `/courses/${courseId}`,
  learn: (courseId: string) => `/learn/${courseId}`,
  books: '/books',
  bookDetail: (bookId: string) => `/books/${bookId}`,
  read: (bookId: string) => `/read/${bookId}`,
  checkout: (type: string, id: string, format?: string) =>
    `/checkout/${type}/${id}${format ? `/${format}` : ''}`,
  communityBlog: (blogId: string) => `/community/blogs/${blogId}`,
  consultationChat: (consultationId: string) => `/consultation/${consultationId}/chat`,
  clinicDetail: (clinicId: string) => `/clinic/${clinicId}`,
  tripDetail: (tripId: string) => `/trips/${tripId}`,
  // Serves both encyclopedia news and herbal-library entries — the page's
  // EncyclopediaDetail component branches on the entry's `kind`.
  encyclopediaEntry: (entryId: string) => `/encyclopedia/${entryId}`,
  monographDetail: (monographId: string) => `/monograph/${monographId}`,
};
