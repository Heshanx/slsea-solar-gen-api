import { createHash } from "node:crypto";
import { AppError } from "./AppError.js";
export const representationEtag = (body) => `"${createHash("sha256").update(JSON.stringify(body)).digest("base64url")}"`;
export const assertIfMatch = (header, body) => {
  if (!header) throw new AppError("Send If-Match using the current resource ETag", 428);
  const current = representationEtag(body);
  if (header !== "*" && !header.split(",").map(x => x.trim()).includes(current)) {
    throw new AppError("Resource has changed; retrieve it again", 412);
  }
};
export const sendConditionalJson = (req, res, body, modifiedAt) => {
  res.set("Cache-Control", "private");
  res.set("ETag", representationEtag(body));
  if (modifiedAt) {
    const date = new Date(modifiedAt);
    if (Number.isFinite(date.getTime())) res.set("Last-Modified", date.toUTCString());
  }
  if (req.fresh) return res.status(304).end();
  return res.status(200).json(body);
};
