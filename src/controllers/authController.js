import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const registerUser = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createHttpError(400, 'Email in use');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hashedPassword });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  return res.status(201).json(user);
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createHttpError(401, 'Invalid credentials');
  }

  await Session.deleteMany({ userId: user._id });

  const session = await createSession(user._id);
  setSessionCookies(res, session);

  return res.status(200).json(user);
};

const refreshUserSession = async (req, res) => {
  const { sessionId, refreshToken } = req.cookies;

  const session = await Session.findOne({ _id: sessionId, refreshToken });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  if (new Date() > session.refreshTokenValidUntil) {
    throw createHttpError(401, 'Session token expired');
  }

  await Session.deleteOne({ _id: sessionId });

  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  return res.status(200).json({ message: 'Session refreshed' });
};

const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  return res.status(204).end();
};

const requestResetEmail = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(200)
      .json({ message: 'Password reset email sent successfully' });
  }

  const token = jwt.sign(
    { sub: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;

  const templatePath = path.resolve('src/templates/reset-password-email.html');
  const templateSource = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  const html = template({ name: user.username, link: resetLink });

  try {
    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset',
      html,
    });
  } catch {
    throw createHttpError(
      500,
      'Failed to send the email, please try again later.',
    );
  }

  return res
    .status(200)
    .json({ message: 'Password reset email sent successfully' });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw createHttpError(401, 'Invalid or expired token');
  }

  const user = await User.findOne({ _id: decoded.sub, email: decoded.email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(user._id, { password: hashedPassword });

  return res.status(200).json({ message: 'Password reset successfully' });
};

export {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestResetEmail,
  resetPassword,
};
