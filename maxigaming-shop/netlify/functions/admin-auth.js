exports.handler = async (event) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return respond(500, { error: 'ADMIN_PASSWORD ist auf dem Server nicht gesetzt.' });
  }
  const supplied = event.headers['x-admin-password'] || '';
  if (supplied !== adminPassword) {
    return respond(401, { error: 'Falsches Passwort.' });
  }
  return respond(200, { ok: true });
};

function respond(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
