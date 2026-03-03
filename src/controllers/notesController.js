import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

const getAllNotes = async (req, res) => {
  const { page = 1, perPage = 10, tag, search } = req.query;

  const filter = {};
  if (tag) {
    filter.tag = tag;
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const totalNotes = await Note.countDocuments(filter);
  const totalPages = Math.ceil(totalNotes / perPage);
  const notes = await Note.find(filter)
    .skip((page - 1) * perPage)
    .limit(perPage);

  return res.status(200).json({
    page,
    perPage,
    totalNotes,
    totalPages,
    notes,
  });
};

const getNoteById = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findById(noteId);

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  return res.status(200).json(note);
};

const createNote = async (req, res) => {
  const note = await Note.create(req.body);
  return res.status(201).json(note);
};

const updateNote = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndUpdate({ _id: noteId }, req.body, {
    new: true,
  });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  return res.status(200).json(note);
};

const deleteNote = async (req, res) => {
  const { noteId } = req.params;
  const note = await Note.findOneAndDelete({
    _id: noteId,
  });

  if (!note) {
    throw createHttpError(404, 'Note not found');
  }

  return res.status(200).json(note);
};

export { getAllNotes, getNoteById, createNote, updateNote, deleteNote };
