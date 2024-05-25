const express = require('express');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
require('dotenv').config();

const userHandler = express.Router();

userHandler.get('/profile', async (req, res) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return res.status(401).json({ error: 'Token tidak tersedia' });
        }

        const accessToken = authorizationHeader.replace('Bearer ', '');
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        const userDoc = await admin.firestore().collection('user').doc(userId).get();
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User tidak ditemukan' });
        }
    
        const user = userDoc.data();
    
        res.status(200).json(user);
    } catch (error) {
        console.error('Kesalahan mendapatkan data pengguna:', error);
        res.status(500).json({ error: 'Kesalahan Server Internal' });
    }
});

userHandler.put('/profile', async (req, res) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return res.status(401).json({ error: 'Token tidak tersedia' });
        }

        const accessToken = authorizationHeader.replace('Bearer ', '');
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        const { email, password } = req.body;

        const userDoc = await admin.firestore().collection('user').doc(userId).get();
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        await admin.firestore().collection('user').doc(userId).update({ email, password });

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Kesalahan memperbarui profil pengguna:', error);
        res.status(500).json({ error: 'Kesalahan Server Internal' });
    }
});

userHandler.put('/put/password', async (req, res) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return res.status(401).json({ error: 'Token tidak tersedia' });
        }

        const accessToken = authorizationHeader.replace('Bearer ', '');
        const decodedToken = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decodedToken.userId;

        const { oldPassword, newPassword } = req.body;

        const userDoc = await admin.firestore().collection('user').doc(userId).get();
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User tidak ditemukan' });
        }

        const userData = userDoc.data();

        const isPasswordValid = await bcrypt.compare(oldPassword, userData.password);
        if (!isPasswordValid) {
        return res.status(401).json({ error: 'Kata sandi lama tidak valid' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await admin.firestore().collection('user').doc(userId).update({ password: hashedNewPassword });

        res.status(200).json({ message: 'Kata sandi berhasil diperbarui' });
    } catch (error) {
        console.error('Kesalahan memperbarui kata sandi:', error);
        res.status(500).json({ error: 'Kesalahan Server Internal' });
    }
});

module.exports = userHandler;