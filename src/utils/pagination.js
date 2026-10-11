export const pageMetadata = (req, { page, limit }, total) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const link = n => {
    if (n < 1 || n > totalPages) return null;
    const url = new URL(req.originalUrl, "http://localhost");
    url.searchParams.set("page", String(n));
    url.searchParams.set("limit", String(limit));
    return `${url.pathname}${url.search}`;
  };
  return { page, limit, total, totalPages, first: link(1), previous: link(page - 1), next: link(page + 1), last: link(totalPages) };
};
