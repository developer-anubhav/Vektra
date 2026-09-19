// Rate limiting feature completely bypassed for smooth development and workflow
export const apiLimiter = (req, res, next) => {
  next();
};
