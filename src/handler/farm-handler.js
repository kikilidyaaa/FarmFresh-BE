const express = require('express');
const admin = require('firebase-admin');
const multer = require('multer');
require('dotenv').config();

const farmHandler = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

farmHandler.get('/farm', async (req, res) => {
  try {
    const farms = await admin.firestore().collection('farm').get();
    const farmList = [];
    farms.forEach((farm) => {
      farmList.push({
        idfarm: farm.id,
        name: farm.data().name,
        image: farm.data().image,
        location: farm.data().location,
      });
    });
    res.status(200).json(farmList);
  } catch (error) {
    console.error('Kesalahan mengambil Pertanian:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

farmHandler.get('/farm/:id', async (req, res) => {
  try {
    const farmId = req.params.id;
    const farm = await admin.firestore().collection('farm').doc(farmId).get();
    if (!farm.exists) {
      return res.status(404).json({ error: 'Pertanian tidak ditemukan' });
    }
    res.status(200).json({
      idfarm: farm.id,
      name: farm.data().name,
      image: farm.data().image,
      location: farm.data().location,
    });
  } catch (error) {
    console.error('Kesalahan mengambil Pertanian:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

farmHandler.post('/farm', upload.single('image'), async (req, res) => {
  try {
    const { name, location } = req.body;
    const file = req.file;

    const fileName = `${Date.now()}_${file.originalname}`;
    const bucket = admin.storage().bucket('farm-fresh-d8e1b.appspot.com');

    const fileUpload = bucket.file(fileName);
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;

    const farm = await admin.firestore().collection('farm').add({
      name,
      image: imageUrl,
      location,
    });
    res.status(201).json({ message: 'Pertanian berhasil ditambahkan', id: farm.id });
  } catch (error) {
    console.error('Kesalahan menambahkan Pertanian:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

farmHandler.put('/farm/:id', upload.single('image'), async (req, res) => {
  try {
    const farmId = req.params.id;
    const { name, location } = req.body;
    const file = req.file;

    let imageUrl;

    if (file) {
      const fileName = `${Date.now()}_${file.originalname}`;
      const bucket = admin.storage().bucket('farm-fresh-d8e1b.appspot.com');

      const fileUpload = bucket.file(fileName);
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media`;
    }

    const farmDoc = await admin.firestore().collection('farm').doc(farmId).get();
    if (!farmDoc.exists) {
      return res.status(404).json({ error: 'Pertanian tidak ditemukan' });
    }

    const existingFarmData = farmDoc.data();

    const updatedFarmData = {
      name: name || existingFarmData.name,
      location: location || existingFarmData.location,
      image: imageUrl || existingFarmData.image,
    };

    Object.keys(updatedFarmData).forEach(key => {
      if (updatedFarmData[key] === undefined) {
        delete updatedFarmData[key];
      }
    });

    await admin.firestore().collection('farm').doc(farmId).update(updatedFarmData);

    res.status(200).json({ message: 'Pertanian berhasil diperbarui' });
  } catch (error) {
    console.error('Kesalahan memperbarui pertanian:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

farmHandler.delete('/farm/:id', async (req, res) => {
  try {
    const farmId = req.params.id;
    const farm = await admin.firestore().collection('farm').doc(farmId).delete();
    res.status(200).json({ message: 'Pertanian berhasil dihapus' });
  } catch (error) {
    console.error('Kesalahan menghapus pertanian:', error);
    res.status(500).json({ error: 'Kesalahan Server Internal' });
  }
});

module.exports = farmHandler;