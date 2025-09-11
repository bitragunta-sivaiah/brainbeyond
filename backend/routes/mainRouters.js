import express from 'express';
import Ad from '../models/Ad.js';
import Announcement from '../models/Announcement.js';

const router = express.Router();

// Ad Routes (No changes needed)
router.get('/ads', async (req, res) => {
  try {
    const ads = await Ad.find();
    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/ads/:id', async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.status(200).json(ad);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/ads', async (req, res) => {
  const ad = new Ad(req.body);
  try {
    const newAd = await ad.save();
    res.status(201).json(newAd);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch('/ads/:id', async (req, res) => {
  try {
    const updatedAd = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.status(200).json(updatedAd);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/ads/:id', async (req, res) => {
  try {
    const deletedAd = await Ad.findByIdAndDelete(req.params.id);
    if (!deletedAd) {
      return res.status(404).json({ message: 'Ad not found' });
    }
    res.status(200).json({ message: 'Ad deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Announcement Routes
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('author','username email  profileInfo').populate('course','title');
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('author','username email  profileInfo').populate('course','title');
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CORRECTED: Handle course field conditionally for POST request
router.post('/announcements', async (req, res) => {
  const announcementData = { ...req.body };
  
  if (announcementData.target !== 'specific-course') {
    delete announcementData.course;
  }

  const announcement = new Announcement(announcementData);
  try {
    const newAnnouncement = await announcement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// CORRECTED: Handle course field conditionally for PATCH request
router.patch('/announcements/:id', async (req, res) => {
  const announcementData = { ...req.body };

  if (announcementData.target !== 'specific-course') {
    delete announcementData.course;
  }

  try {
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(req.params.id, announcementData, { new: true }).populate('author','username email  profileInfo').populate('course','title');
    if (!updatedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json(updatedAnnouncement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const deletedAnnouncement = await Announcement.findByIdAndDelete(req.params.id);
    if (!deletedAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;