import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

const getAllNotes = async (req, res) => {
  const notes = await Note.find();
  return res.status(200).json(notes);
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
