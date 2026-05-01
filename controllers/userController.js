
exports.getSignupPage = (req, res) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${FRONTEND_URL}/signup`);
};

exports.getSigninPage = (req, res) => {
  const redirect = req.query.redirect
    ? decodeURIComponent(req.query.redirect)
    : "/";
  const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${FRONTEND_URL}/login?redirect=${encodeURIComponent(redirect)}`);
};